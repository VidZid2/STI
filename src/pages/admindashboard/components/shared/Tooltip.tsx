import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TooltipProps {
    content: string;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top', delay = 0.2 }) => {
    const [isVisible, setIsVisible] = useState(false);

    let origin = { y: 0, x: 0 };
    let animate = { y: 0, x: 0 };
    let arrowClass = '';
    let posClass = '';

    switch (position) {
        case 'top':
            origin = { y: 5, x: 0 }; animate = { y: -5, x: 0 };
            posClass = 'bottom-full left-1/2 -translate-x-1/2 mb-2';
            arrowClass = 'top-full left-1/2 -translate-x-1/2 border-t-slate-900 dark:border-t-slate-100 border-l-transparent border-r-transparent border-b-transparent';
            break;
        case 'bottom':
            origin = { y: -5, x: 0 }; animate = { y: 5, x: 0 };
            posClass = 'top-full left-1/2 -translate-x-1/2 mt-2';
            arrowClass = 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-900 dark:border-b-slate-100 border-l-transparent border-r-transparent border-t-transparent';
            break;
        case 'left':
            origin = { x: 5, y: 0 }; animate = { x: -5, y: 0 };
            posClass = 'right-full top-1/2 -translate-y-1/2 mr-2';
            arrowClass = 'left-full top-1/2 -translate-y-1/2 border-l-slate-900 dark:border-l-slate-100 border-t-transparent border-b-transparent border-r-transparent';
            break;
        case 'right':
            origin = { x: -5, y: 0 }; animate = { x: 5, y: 0 };
            posClass = 'left-full top-1/2 -translate-y-1/2 ml-2';
            arrowClass = 'right-full top-1/2 -translate-y-1/2 border-r-slate-900 dark:border-r-slate-100 border-t-transparent border-b-transparent border-l-transparent';
            break;
    }

    return (
        <div 
            className="relative inline-flex"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, ...origin, scale: 0.95 }}
                        animate={{ opacity: 1, ...animate, scale: 1 }}
                        exit={{ opacity: 0, ...origin, scale: 0.95 }}
                        transition={{ duration: 0.15, delay }}
                        className={`absolute z-50 whitespace-nowrap px-2.5 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-bold rounded-md shadow-xl pointer-events-none ${posClass}`}
                    >
                        {content}
                        <div className={`absolute border-[4px] ${arrowClass}`} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
