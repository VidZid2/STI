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
    isSearching = false }) => {
    void _resultCount;
    void _totalCount;

    return (
        <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative w-full group/search"
        >
            <svg className="absolute left-3.5 top-0 bottom-0 my-auto w-4 h-4 text-zinc-400 z-10 transition-colors duration-200 group-focus-within/search:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50/80 pl-11 pr-12 py-2 text-sm font-semibold focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all duration-300 text-zinc-900 placeholder-zinc-400 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/10"
            />
            <div className="absolute right-3 top-0 bottom-0 flex items-center z-10">
                <AnimatePresence mode="wait">
                    {isSearching && value ? (
                        <motion.div
                            key="spinner"
                            initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.8, rotate: 90 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                            className="w-6 h-6 flex items-center justify-center"
                        >
                            <svg className="w-4 h-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        </motion.div>
                    ) : value ? (
                        <motion.button
                            key="close"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onChange('')}
                            aria-label="Clear search"
                            className="group/close relative w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        >
                            <span className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 opacity-0 group-hover/close:opacity-100 transition-opacity duration-200" />
                            <span className="absolute inset-[2px] rounded-full bg-zinc-200/80 group-hover/close:bg-transparent dark:bg-zinc-700 transition-colors duration-200" />
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="relative z-10 text-zinc-400 group-hover/close:text-blue-500 dark:text-zinc-500 dark:group-hover/close:text-white transition-colors duration-200">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </motion.button>
                    ) : null}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: { label: string; onClick: () => void };
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, className = '' }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`relative overflow-hidden w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-[20px] sm:rounded-[24px] p-6 sm:p-10 flex flex-col items-center justify-center text-center group transition-all duration-300 hover:shadow-md ${className}`}
    >
        {/* SaaS Accents */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/[0.03] rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-blue-400/5 dark:bg-blue-400/[0.03] rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />

        {/* Animated Icon Container (STUDY TOOLS style) */}
        <motion.div
            whileHover={{ scale: 1.08, rotate: -5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className="w-16 h-16 rounded-[20px] bg-blue-50 border border-blue-100 text-blue-600 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400 flex items-center justify-center mb-5 relative z-10 shadow-sm"
        >
            {icon}
        </motion.div>

        <div className="relative z-10 flex flex-col items-center">
            <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-[17px] font-extrabold text-slate-900 dark:text-slate-100 tracking-tight m-0 mb-1.5 leading-snug">
                {title}
            </motion.h3>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-[13.5px] text-slate-500 dark:text-slate-400 font-normal leading-relaxed m-0 max-w-[280px] mb-6">
                {description}
            </motion.p>
            {action && (
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={action.onClick}
                    className="px-6 py-2.5 text-[13px] font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl transition-all shadow-sm shadow-blue-500/20 hover:shadow-blue-500/40"
                >
                    {action.label}
                </motion.button>
            )}
        </div>
    </motion.div>
);

interface TeacherActionButtonProps {
    variant: 'primary' | 'secondary' | 'icon';
    icon: React.ReactNode;
    label?: string;
    onClick?: () => void;
}

export const TeacherActionButton: React.FC<TeacherActionButtonProps> = ({ variant, icon, label, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    if (variant === 'primary') {
        return (
            <button
                onClick={onClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer"
                style={{
                    background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: isHovered ? '0 6px 20px rgba(59, 130, 246, 0.2)' : 'none' }}
            >
                {icon}{label}
            </button>
        );
    }
    if (variant === 'secondary') {
        return (
            <button
                onClick={onClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer"
                style={{
                    background: isHovered ? 'rgba(0,0,0,0.03)' : 'transparent', color: '#71717a',
                    border: '1px solid rgba(0,0,0,0.1)',
                    transform: isHovered ? 'scale(1.02)' : 'scale(1)' }}
            >
                {icon}{label}
            </button>
        );
    }
    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="flex items-center justify-center py-2.5 px-3 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer"
            style={{
                background: isHovered ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.02)', color: '#71717a',
                border: '1px solid rgba(0,0,0,0.08)',
                transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
        >
            {icon}
        </button>
    );
};
