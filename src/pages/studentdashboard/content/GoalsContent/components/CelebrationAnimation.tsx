/**
 * CelebrationAnimation
 * Confetti/celebration overlay when a goal is completed.
 * Extracted from GoalsContent.tsx during Phase 8.3
 */
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Confetti, type ConfettiRef } from '@/components/ui/confetti';

// Celebration Animation Component - Minimalistic Blue Theme
const CelebrationAnimation: React.FC<{
    isVisible: boolean;
    onComplete: () => void;
    goalTitle?: string;
}> = ({ isVisible, onComplete, goalTitle }) => {
    const confettiRef = useRef<ConfettiRef>(null);

    useEffect(() => {
        if (isVisible) {
            const duration = 3500;
            const end = Date.now() + duration;

            const frame = () => {
                confettiRef.current?.fire({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']
                });
                confettiRef.current?.fire({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };
            frame();

            const timer = setTimeout(onComplete, 4000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onComplete]);

    return createPortal(
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={onComplete}
                    className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-[10001] flex items-center justify-center cursor-pointer p-4"
                >
                    <Confetti 
                        ref={confettiRef}
                        manualstart={true}
                        className="fixed inset-0 z-[10005] w-full h-full pointer-events-none" 
                    />

                    {/* Center card */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white dark:bg-slate-800 rounded-[24px] p-8 sm:p-10 flex flex-col items-center gap-5 shadow-2xl border border-slate-200 dark:border-slate-700/50 max-w-[340px] w-full text-center relative overflow-hidden"
                    >
                        {/* Decorative glow */}
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-blue-500/10 dark:bg-blue-400/5 rounded-full blur-2xl pointer-events-none" />

                        {/* Icon */}
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 25 }}
                            className="w-14 h-14 rounded-[20px] bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50 flex items-center justify-center flex-shrink-0 shadow-sm relative transition-transform duration-300"
                        >
                            <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </motion.div>

                        {/* Title */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="z-10"
                        >
                            <h3 className="text-[22px] font-bold text-slate-900 dark:text-white tracking-tight mb-1.5">
                                Goal Completed!
                            </h3>
                            {goalTitle && (
                                <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                    {goalTitle}
                                </p>
                            )}
                        </motion.div>

                        {/* Progress indicator */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.35 }}
                            className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-[12px] z-10"
                        >
                            <span className="text-[13px] font-bold text-indigo-600 dark:text-indigo-400">
                                100% Complete
                            </span>
                        </motion.div>

                        {/* Dismiss button */}
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45 }}
                            onClick={onComplete}
                            className="w-full mt-2 py-3 px-6 rounded-[14px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[14px] transition-colors flex items-center justify-center gap-2 shadow-sm focus:outline-none z-10"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                            Dismiss
                        </motion.button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};


export { CelebrationAnimation };
