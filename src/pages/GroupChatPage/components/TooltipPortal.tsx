/**
 * Tooltip Portal Component
 * Renders tooltip at correct position using portal
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';

interface TooltipPortalProps {
    text: string;
    buttonRect: DOMRect | null;
    placement?: 'above' | 'below' | 'left' | 'right';
    icon?: React.ReactNode;
    textColor?: string;
}

export const TooltipPortal: React.FC<TooltipPortalProps> = ({ 
    text, buttonRect, placement = 'below', icon, textColor 
}) => {
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<{ top: number; left: number; arrowPos: number } | null>(null);

    useEffect(() => {
        setPosition(null);
        if (buttonRect) {
            requestAnimationFrame(() => {
                if (tooltipRef.current) {
                    const tooltipRect = tooltipRef.current.getBoundingClientRect();
                    
                    if (placement === 'left') {
                        const left = buttonRect.left - tooltipRect.width - 8;
                        const buttonCenterY = buttonRect.top + buttonRect.height / 2;
                        let top = buttonCenterY - tooltipRect.height / 2;
                        let arrowPos = tooltipRect.height / 2;
                        
                        const minTop = 8;
                        if (top < minTop) {
                            arrowPos = buttonCenterY - minTop;
                            top = minTop;
                        }
                        
                        const maxBottom = window.innerHeight - 8;
                        if (top + tooltipRect.height > maxBottom) {
                            const newTop = maxBottom - tooltipRect.height;
                            arrowPos = buttonCenterY - newTop;
                            top = newTop;
                        }
                        
                        setPosition({ top, left, arrowPos });
                    } else if (placement === 'right') {
                        const left = buttonRect.right + 8;
                        const buttonCenterY = buttonRect.top + buttonRect.height / 2;
                        let top = buttonCenterY - tooltipRect.height / 2;
                        let arrowPos = tooltipRect.height / 2;
                        
                        const minTop = 8;
                        if (top < minTop) {
                            arrowPos = buttonCenterY - minTop;
                            top = minTop;
                        }
                        
                        const maxBottom = window.innerHeight - 8;
                        if (top + tooltipRect.height > maxBottom) {
                            const newTop = maxBottom - tooltipRect.height;
                            arrowPos = buttonCenterY - newTop;
                            top = newTop;
                        }
                        
                        setPosition({ top, left, arrowPos });
                    } else {
                        const buttonCenterX = buttonRect.left + buttonRect.width / 2;
                        let left = buttonCenterX - tooltipRect.width / 2;
                        let arrowPos = tooltipRect.width / 2;
                        
                        const minLeft = 8;
                        if (left < minLeft) {
                            arrowPos = buttonCenterX - minLeft;
                            left = minLeft;
                        }
                        
                        const maxRight = window.innerWidth - 8;
                        if (left + tooltipRect.width > maxRight) {
                            const newLeft = maxRight - tooltipRect.width;
                            arrowPos = buttonCenterX - newLeft;
                            left = newLeft;
                        }
                        
                        const top = placement === 'above' 
                            ? buttonRect.top - tooltipRect.height - 8
                            : buttonRect.bottom + 8;
                        
                        setPosition({ top, left, arrowPos });
                    }
                }
            });
        }
    }, [buttonRect, placement]);

    if (!buttonRect) return null;

    const isAbove = placement === 'above';
    const isLeft = placement === 'left';
    const isRight = placement === 'right';

    const getInitialAnimation = () => {
        if (isLeft) return { opacity: 0, x: 6, scale: 0.95 };
        if (isRight) return { opacity: 0, x: -6, scale: 0.95 };
        return { opacity: 0, y: isAbove ? 6 : -6, scale: 0.95 };
    };
    
    const getExitAnimation = () => {
        if (isLeft) return { opacity: 0, x: 6, scale: 0.95 };
        if (isRight) return { opacity: 0, x: -6, scale: 0.95 };
        return { opacity: 0, y: isAbove ? 6 : -6, scale: 0.95 };
    };

    return createPortal(
        <motion.div
            ref={tooltipRef}
            initial={getInitialAnimation()}
            animate={{ opacity: position ? 1 : 0, x: 0, y: 0, scale: 1 }}
            exit={getExitAnimation()}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            style={{
                position: 'fixed',
                top: position?.top ?? -9999,
                left: position?.left ?? -9999,
                padding: '6px 10px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                color: textColor || '#3b82f6',
                fontSize: '12px',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                zIndex: 99999,
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
            }}
        >
            {isRight && (
                <>
                    <div style={{
                        position: 'absolute', left: -6, top: position?.arrowPos ?? '50%',
                        transform: 'translateY(-50%)',
                        borderTop: '5px solid transparent', borderBottom: '5px solid transparent',
                        borderRight: '5px solid rgba(0, 0, 0, 0.08)',
                    }} />
                    <div style={{
                        position: 'absolute', left: -4, top: position?.arrowPos ?? '50%',
                        transform: 'translateY(-50%)',
                        borderTop: '4px solid transparent', borderBottom: '4px solid transparent',
                        borderRight: '4px solid rgba(255, 255, 255, 0.98)',
                    }} />
                </>
            )}
            {isLeft && (
                <>
                    <div style={{
                        position: 'absolute', right: -6, top: position?.arrowPos ?? '50%',
                        transform: 'translateY(-50%)',
                        borderTop: '5px solid transparent', borderBottom: '5px solid transparent',
                        borderLeft: '5px solid rgba(0, 0, 0, 0.08)',
                    }} />
                    <div style={{
                        position: 'absolute', right: -4, top: position?.arrowPos ?? '50%',
                        transform: 'translateY(-50%)',
                        borderTop: '4px solid transparent', borderBottom: '4px solid transparent',
                        borderLeft: '4px solid rgba(255, 255, 255, 0.98)',
                    }} />
                </>
            )}
            {!isLeft && !isRight && (
                <>
                    <div style={{
                        position: 'absolute',
                        ...(isAbove ? { bottom: -6 } : { top: -6 }),
                        left: position?.arrowPos ?? '50%',
                        transform: 'translateX(-50%)',
                        borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
                        ...(isAbove 
                            ? { borderTop: '5px solid rgba(0, 0, 0, 0.08)' }
                            : { borderBottom: '5px solid rgba(0, 0, 0, 0.08)' }
                        ),
                    }} />
                    <div style={{
                        position: 'absolute',
                        ...(isAbove ? { bottom: -4 } : { top: -4 }),
                        left: position?.arrowPos ?? '50%',
                        transform: 'translateX(-50%)',
                        borderLeft: '4px solid transparent', borderRight: '4px solid transparent',
                        ...(isAbove 
                            ? { borderTop: '4px solid rgba(255, 255, 255, 0.98)' }
                            : { borderBottom: '4px solid rgba(255, 255, 255, 0.98)' }
                        ),
                    }} />
                </>
            )}
            {icon}
            {text}
        </motion.div>,
        document.body
    );
};
