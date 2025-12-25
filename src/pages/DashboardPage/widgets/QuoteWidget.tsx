/**
 * QuoteWidget Component
 * Displays daily motivational quote with STI colors (Blue & Yellow)
 */

import React from 'react';
import { motion } from 'motion/react';

interface QuoteWidgetProps {
    quote: { text: string; author: string };
    compactMode?: boolean;
    onClose: () => void;
}

export const QuoteWidget: React.FC<QuoteWidgetProps> = ({
    quote,
    compactMode = false,
    onClose,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            whileHover={{ y: -2, boxShadow: '0 4px 16px rgba(30, 64, 175, 0.25)' }}
            className={`bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-xl border border-blue-500/30 overflow-hidden ${compactMode ? 'shadow-none' : 'shadow-lg shadow-blue-900/20'}`}
            id="quote-widget"
        >
            <div className={`relative ${compactMode ? 'p-3' : 'p-4'}`}>
                {/* Close button */}
                <motion.button
                    whileHover={{ scale: 1.15, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className={`absolute top-2 right-2 flex items-center justify-center rounded-md text-yellow-300/60 hover:text-white transition-colors ${compactMode ? 'w-5 h-5' : 'w-6 h-6'}`}
                >
                    <svg className={compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </motion.button>

                {/* Quote Icon */}
                <motion.div
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
                    className="mb-2"
                >
                    <svg className={`text-yellow-400 ${compactMode ? 'w-5 h-5' : 'w-6 h-6'}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                </motion.div>

                {/* Quote Text */}
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className={`text-yellow-300 leading-relaxed font-medium italic ${compactMode ? 'text-[11px]' : 'text-xs'}`}
                >
                    "{quote.text}"
                </motion.p>

                {/* Author */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className={`text-yellow-400 mt-2 font-semibold ${compactMode ? 'text-[9px]' : 'text-[10px]'}`}
                >
                    — {quote.author}
                </motion.p>

                {/* Daily indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center gap-1 mt-3 pt-2 border-t border-blue-500/30"
                >
                    <svg className={`text-yellow-400 ${compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className={`text-yellow-300/80 ${compactMode ? 'text-[8px]' : 'text-[9px]'}`}>
                        Daily inspiration
                    </span>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default QuoteWidget;
