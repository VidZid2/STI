import * as React from 'react';
import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';

interface ToolsNavTooltipProps {
    children: React.ReactNode;
    isExpanded?: boolean;
}

const ToolsNavTooltip: React.FC<ToolsNavTooltipProps> = ({ children, isExpanded = true }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const containerRef = useRef<HTMLAnchorElement>(null);

    const handleMouseEnter = (e: React.MouseEvent) => {
        // Don't show tooltip when sidebar is collapsed
        if (!isExpanded) return;
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        setTooltipPosition({
            top: rect.top + rect.height / 2,
            left: rect.right + 12,
        });
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    // Clone children and attach event handlers
    const childrenWithProps = React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
                onMouseEnter: handleMouseEnter,
                onMouseLeave: handleMouseLeave,
                ref: containerRef,
            });
        }
        return child;
    });

    return (
        <>
            {childrenWithProps}
            {createPortal(
                <AnimatePresence>
                    {isHovered && (
                        <motion.div
                            className="flex items-center relative"
                            initial={{ opacity: 0, x: -10, y: "-50%" }}
                            animate={{ opacity: 1, x: 0, y: "-50%" }}
                            exit={{ opacity: 0, x: -10, y: "-50%" }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            style={{
                                position: 'fixed',
                                top: tooltipPosition.top,
                                left: tooltipPosition.left,
                                zIndex: 99999,
                            }}
                        >
                            {/* Left Arrow */}
                            <div className="absolute left-[-6px] w-3 h-3 bg-white dark:bg-zinc-950 border-l border-b border-zinc-200/80 dark:border-zinc-800/80 rotate-45 z-20 rounded-bl-[2px]" />
                            
                            {/* Premium 350px Card Content (Student Tools Design - Compact Vertical) */}
                            <div className="w-[350px] p-5 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xl rounded-[20px] overflow-hidden relative flex flex-col gap-4 z-10">
                                {/* SaaS Background Accents */}
                                <div className="absolute top-0 right-0 -mr-12 -mt-12 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
                                <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-24 h-24 bg-emerald-400/10 dark:bg-emerald-400/5 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

                                {/* Upper Section: Icon & Text */}
                                <div className="flex gap-4 relative z-10">
                                    {/* Bouncy Wrench Icon */}
                                    <motion.div
                                        whileHover={{ scale: 1.05, rotate: -5 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                        className="w-[52px] h-[52px] rounded-[16px] bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center flex-shrink-0 shadow-sm relative z-10"
                                    >
                                        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                                        </svg>
                                    </motion.div>

                                    {/* Text Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h2 className="text-[18px] font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none">
                                                Student Tools
                                            </h2>
                                        </div>
                                        <p className="text-[12.5px] text-zinc-500 dark:text-zinc-400 leading-[1.4] font-medium mt-1">
                                            Local-first academic utilities for files, drafts, and writing support. Connected AI tools run only when a service is configured.
                                        </p>
                                    </div>
                                </div>

                                {/* Lower Section: Stats Side-by-Side */}
                                <div className="flex items-center gap-3 relative z-10">
                                    {/* Stat 1: Available Tools */}
                                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900/50 rounded-[14px] border border-zinc-200/80 dark:border-zinc-800/80 hover:border-blue-200 dark:hover:border-blue-800/60 transition-colors flex-1 shadow-sm">
                                        <div className="text-blue-500 bg-blue-50 dark:bg-blue-500/10 p-1.5 rounded-xl border border-blue-100 dark:border-blue-500/20 flex-shrink-0">
                                            <svg className="w-[18px] h-[18px] text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                            </svg>
                                        </div>
                                        <div className="flex flex-col justify-center gap-0.5">
                                            <p className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest leading-none">Available</p>
                                            <p className="text-[12px] font-extrabold text-zinc-900 dark:text-zinc-100 leading-none">11 Tools</p>
                                        </div>
                                    </div>

                                    {/* Stat 2: Local-first Data */}
                                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900/50 rounded-[14px] border border-zinc-200/80 dark:border-zinc-800/80 hover:border-emerald-200 dark:hover:border-emerald-800/60 transition-colors flex-1 shadow-sm">
                                        <div className="text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 p-1.5 rounded-xl border border-emerald-100 dark:border-emerald-500/20 flex-shrink-0">
                                            <svg className="w-[18px] h-[18px] text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                            </svg>
                                        </div>
                                        <div className="flex flex-col justify-center gap-0.5">
                                            <p className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest leading-none">Data</p>
                                            <p className="text-[12px] font-extrabold text-zinc-900 dark:text-zinc-100 leading-none">Local-first</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};

export default ToolsNavTooltip;
