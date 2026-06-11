/**
 * ToolsShared - CategoryTabs + ToolsSkeleton
 * Shared UI components for ToolsContent.
 * Extracted from ToolsContent.tsx during Phase 8.7
 */
import React from 'react';
import { motion } from 'motion/react';

// Premium Category Tabs Component with Sliding Indicator
interface CategoryTabsProps {
    categories: { id: string; name: string; icon: React.ReactNode }[];
    activeCategory: string;
    onCategoryChange: (id: string) => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ categories, activeCategory, onCategoryChange }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
            className="mb-0 flex w-full gap-2 overflow-x-auto rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-2 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)] backdrop-blur-md [scrollbar-width:none] dark:border-zinc-800/80 dark:bg-zinc-950/30"
            role="group"
            aria-label="Tool categories"
        >
            {categories.map((category) => {
                const isActive = activeCategory === category.id;
                
                return (
                    <button
                        type="button"
                        key={category.id}
                        onClick={() => onCategoryChange(category.id)}
                        aria-pressed={isActive}
                        className={`relative flex shrink-0 sm:flex-1 items-center justify-center whitespace-nowrap gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:gap-2.5 sm:px-6 sm:py-3 sm:text-base ${isActive ? 'text-white' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/30'}`}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="activeCategoryTab"
                                className="absolute inset-0 bg-blue-600 dark:bg-blue-500 rounded-xl shadow-md"
                                initial={false}
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center" aria-hidden="true">
                            {category.icon}
                        </span>
                        <span className="relative z-10">
                            {category.name}
                        </span>
                    </button>
                );
            })}
        </motion.div>
    );
};

interface ToolItemSkeletonProps {
    delay?: number;
}

// Mathematically precise Skeleton for an individual ToolItem
const ToolItemSkeleton: React.FC<ToolItemSkeletonProps> = ({ delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, type: 'spring', stiffness: 300 }}
        className="group relative flex h-full min-h-[280px] w-full flex-col items-start overflow-hidden rounded-[20px] border border-zinc-200/70 bg-white p-5 text-left shadow-sm sm:min-h-[300px] sm:p-6 lg:p-7 dark:border-zinc-800/70 dark:bg-zinc-900"
    >
        {/* Background Ambient Glow Placeholder */}
        <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full blur-3xl pointer-events-none bg-zinc-100/50 dark:bg-zinc-800/20" />

        <div className="relative z-10 flex w-full flex-1 flex-col">
            <div className="flex w-full items-start justify-between gap-4">
                {/* Icon skeleton */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 sm:h-12 sm:w-12 animate-pulse dark:border-zinc-700 dark:bg-zinc-800" />

                {/* Badges skeleton */}
                <div className="flex flex-wrap items-center justify-end gap-2">
                    <div className="h-6 w-16 rounded-md bg-zinc-100 animate-pulse dark:bg-zinc-800" />
                    <div className="h-6 w-20 rounded-md bg-zinc-100 animate-pulse dark:bg-zinc-800" />
                    <div className="h-11 w-11 rounded-full bg-zinc-100 animate-pulse dark:bg-zinc-800" />
                </div>
            </div>

            {/* Title */}
            <div className="mt-6 flex min-w-0 flex-col justify-center">
                <div className="h-6 w-32 rounded-md bg-zinc-200 animate-pulse dark:bg-zinc-700" />
            </div>

            {/* Description */}
            <div className="mt-3 w-full text-left space-y-2">
                <div className="h-3.5 w-full rounded bg-zinc-100 animate-pulse dark:bg-zinc-800" />
                <div className="h-3.5 w-4/5 rounded bg-zinc-100 animate-pulse dark:bg-zinc-800" />
            </div>

            {/* Bottom aligned content wrapper */}
            <div className="mt-auto flex w-full flex-col pt-4">
                {/* Best For Module */}
                <div className="mb-4 w-full rounded-[16px] bg-zinc-50/80 px-4 py-3.5 dark:bg-zinc-800/40">
                    <div className="h-2.5 w-16 rounded bg-zinc-200 animate-pulse mb-2 dark:bg-zinc-700" />
                    <div className="h-3.5 w-3/4 rounded bg-zinc-200 animate-pulse dark:bg-zinc-700" />
                </div>

                {/* Action footer */}
                <div className="flex w-full items-center justify-start gap-1.5 border-t border-zinc-200 pt-4 dark:border-zinc-700/60">
                    <div className="h-3.5 w-24 rounded bg-zinc-200 animate-pulse dark:bg-zinc-700" />
                </div>
            </div>
        </div>
    </motion.div>
);

interface ToolsSkeletonProps {
    count?: number;
    className?: string;
}

// Premium Skeleton Loading Component for Tools
const ToolsSkeleton: React.FC<ToolsSkeletonProps> = ({ count = 7, className = '' }) => (
    <div className={`tools-content ${className}`} role="status" aria-label="Loading tools">
        {/* SaaS Compact Hero Section Skeleton */}
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8"
            aria-hidden="true"
        >
            <motion.div
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-200/40 dark:via-zinc-800/20 to-transparent z-10"
            />
            
            <div className="flex items-center gap-6 relative z-0 w-full md:w-auto">
                <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex-shrink-0 animate-pulse" />
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-48 h-8 bg-zinc-200 dark:bg-zinc-700 rounded-md animate-pulse" />
                    </div>
                    <div className="w-72 h-4 bg-zinc-100 dark:bg-zinc-800 rounded-sm mt-2 animate-pulse" />
                    <div className="w-48 h-4 bg-zinc-100 dark:bg-zinc-800 rounded-sm mt-2 animate-pulse" />
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 relative z-0 w-full md:w-auto">
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 w-40 h-[68px]">
                    <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
                    <div className="flex-1">
                        <div className="w-16 h-3 bg-zinc-200 dark:bg-zinc-700 rounded mb-1 animate-pulse" />
                        <div className="w-20 h-5 bg-zinc-200 dark:bg-zinc-600 rounded animate-pulse" />
                    </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 w-40 h-[68px]">
                    <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
                    <div className="flex-1">
                        <div className="w-16 h-3 bg-zinc-200 dark:bg-zinc-700 rounded mb-1 animate-pulse" />
                        <div className="w-20 h-5 bg-zinc-200 dark:bg-zinc-600 rounded animate-pulse" />
                    </div>
                </div>
            </div>
        </motion.div>

        {/* Search and Steps Sidebar Skeleton */}
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            aria-hidden="true"
            className="mb-7 grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]"
        >
            <div className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900 sm:p-7">
                <div className="relative z-10 flex flex-col gap-6">
                    <div className="min-w-0">
                        <div className="h-7 w-64 rounded bg-zinc-200 animate-pulse dark:bg-zinc-700" />
                        <div className="mt-3 h-4 w-96 rounded bg-zinc-100 animate-pulse dark:bg-zinc-800" />
                        <div className="mt-2 h-4 w-72 rounded bg-zinc-100 animate-pulse dark:bg-zinc-800" />
                    </div>
                    <div className="relative w-full">
                        <div className="h-12 w-full rounded-2xl bg-zinc-100 animate-pulse dark:bg-zinc-800/50" />
                    </div>

                    {/* Category Tabs Skeleton */}
                    <div className="flex w-fit gap-1 rounded-[14px] border border-zinc-200 bg-zinc-100/50 p-1.5 dark:border-zinc-800 dark:bg-zinc-900/50">
                        {[0, 1, 2].map(i => (
                            <div
                                key={i}
                                className={`h-10 w-[120px] rounded-[10px] animate-pulse ${i === 0 ? 'bg-zinc-300 dark:bg-zinc-700' : 'bg-zinc-200 dark:bg-zinc-800'}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                {[0, 1, 2].map(i => (
                    <div key={i} className="flex w-full items-center gap-4 rounded-[20px] border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-900 sm:p-5">
                        <div className="h-11 w-11 shrink-0 rounded-[14px] bg-zinc-100 animate-pulse dark:bg-zinc-800 sm:h-12 sm:w-12" />
                        <div className="flex flex-1 flex-col gap-1.5">
                            <div className="h-2.5 w-12 rounded bg-zinc-200 animate-pulse dark:bg-zinc-700" />
                            <div className="h-4 w-24 rounded bg-zinc-200 animate-pulse dark:bg-zinc-700" />
                            <div className="h-3 w-32 rounded bg-zinc-100 animate-pulse dark:bg-zinc-800" />
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>

        {/* Tools Grid Skeleton */}
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            aria-hidden="true"
            className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2 2xl:grid-cols-3"
        >
            {[...Array(count)].map((_, i) => (
                <ToolItemSkeleton key={i} delay={0.4 + i * 0.05} />
            ))}
        </motion.div>
    </div>
);


export { CategoryTabs, ToolsSkeleton };
