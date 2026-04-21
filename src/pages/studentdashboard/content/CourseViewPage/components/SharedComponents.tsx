/**
 * SharedComponents
 * Small reusable UI components used across CourseViewPage.
 * Extracted from CourseViewPage.tsx during Phase 8.1
 */
import * as React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    resultCount?: number;
    totalCount?: number;
    isSearching?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    value,
    onChange,
    placeholder = 'Search...',
    resultCount: _resultCount,
    totalCount: _totalCount,
    isSearching = false,
}) => {
    void _resultCount;
    void _totalCount;

    const [isFocused, setIsFocused] = useState(false);

    return (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="relative">
            <motion.div
                className={`relative flex items-center rounded-xl border bg-white transition-all duration-200 ${
                    isFocused ? 'border-blue-300 shadow-sm ring-2 ring-blue-500/10' : 'border-zinc-200'
                }`}
            >
                <motion.svg
                    className="absolute left-3.5 w-4 h-4 text-zinc-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    animate={{ scale: isFocused ? 1.05 : 1 }}
                    transition={{ duration: 0.15 }}
                >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" strokeLinecap="round" />
                </motion.svg>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholder}
                    className="w-full h-10 pl-10 pr-12 text-sm rounded-xl bg-transparent placeholder-zinc-400 focus:outline-none"
                />
                <div className="absolute right-3 flex items-center gap-2">
                    <AnimatePresence mode="wait">
                        {isSearching && value ? (
                            <motion.div
                                key="spinner"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.15 }}
                                className="w-5 h-5 flex items-center justify-center"
                            >
                                <motion.div
                                    className="w-4 h-4 border-2 border-zinc-200 border-t-blue-500 rounded-full"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                                />
                            </motion.div>
                        ) : value ? (
                            <motion.button
                                key="close"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.15 }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => onChange('')}
                                aria-label="Clear search"
                                className="w-5 h-5 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors"
                            >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-500">
                                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                                </svg>
                            </motion.button>
                        ) : null}
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    );
};

interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: { label: string; onClick: () => void };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="flex flex-col items-center justify-center py-16 px-6"
    >
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-zinc-50 to-zinc-100 border border-zinc-200 flex items-center justify-center mb-4"
        >
            <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} className="text-zinc-400">
                {icon}
            </motion.div>
        </motion.div>
        <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-sm font-semibold text-zinc-700 mb-1">
            {title}
        </motion.h3>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-xs text-zinc-500 text-center max-w-[200px] mb-4">
            {description}
        </motion.p>
        {action && (
            <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={action.onClick}
                className="px-4 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
                {action.label}
            </motion.button>
        )}
    </motion.div>
);
