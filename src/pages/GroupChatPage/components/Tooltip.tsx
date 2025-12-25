/**
 * Tooltip Component
 * Wraps children and shows tooltip on hover
 */

import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { TooltipPortal } from './TooltipPortal';

interface TooltipProps {
    text: string;
    children: React.ReactNode;
    placement?: 'above' | 'below' | 'left';
}

export const Tooltip: React.FC<TooltipProps> = ({ text, children, placement = 'below' }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

    const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
        const button = e.currentTarget.querySelector('button') || e.currentTarget.firstElementChild as HTMLElement;
        if (button) {
            setButtonRect(button.getBoundingClientRect());
        } else {
            setButtonRect(e.currentTarget.getBoundingClientRect());
        }
        setShowTooltip(true);
    };

    const handleMouseLeave = () => {
        setShowTooltip(false);
        setButtonRect(null);
    };

    return (
        <>
            <span onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                {children}
            </span>
            <AnimatePresence>
                {showTooltip && <TooltipPortal text={text} buttonRect={buttonRect} placement={placement} />}
            </AnimatePresence>
        </>
    );
};
