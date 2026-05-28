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
            className="mb-8 flex w-full gap-2 overflow-x-auto rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm backdrop-blur-md [scrollbar-width:none] dark:border-zinc-700/50 dark:bg-zinc-800/40 sm:w-fit sm:mx-auto"
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
                        className={`relative flex shrink-0 items-center gap-2.5 rounded-xl px-5 py-3 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:px-6 sm:text-base ${isActive ? 'text-white' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/30'}`}
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


// Premium Skeleton Loading Component for Tools
const ToolsSkeleton: React.FC = () => (
    <div className="tools-content" role="status" aria-label="Loading tools">
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
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent z-10"
            />
            
            <div className="flex items-center gap-6 relative z-0 w-full md:w-auto">
                <div className="w-16 h-16 rounded-2xl bg-zinc-200 dark:bg-zinc-800 flex-shrink-0 animate-pulse" />
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-48 h-8 bg-zinc-300 dark:bg-zinc-700 rounded-md animate-pulse" />
                    </div>
                    <div className="w-72 h-4 bg-zinc-200 dark:bg-zinc-800 rounded-sm mt-2 animate-pulse" />
                    <div className="w-48 h-4 bg-zinc-200 dark:bg-zinc-800 rounded-sm mt-2 animate-pulse" />
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 relative z-0 w-full md:w-auto">
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 w-40 h-[68px] animate-pulse">
                    <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
                    <div className="flex-1">
                        <div className="w-16 h-3 bg-zinc-200 dark:bg-zinc-700 rounded mb-1" />
                        <div className="w-20 h-5 bg-zinc-300 dark:bg-zinc-600 rounded" />
                    </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 w-40 h-[68px] animate-pulse">
                    <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
                    <div className="flex-1">
                        <div className="w-16 h-3 bg-zinc-200 dark:bg-zinc-700 rounded mb-1" />
                        <div className="w-20 h-5 bg-zinc-300 dark:bg-zinc-600 rounded" />
                    </div>
                </div>
            </div>
        </motion.div>

        {/* Category Tabs Skeleton */}
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            aria-hidden="true"
            style={{
                display: 'flex',
                gap: '0.25rem',
                marginBottom: '2rem',
                padding: '0.375rem',
                background: '#f1f5f9',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                width: 'fit-content' }}
        >
            {[0, 1, 2].map(i => (
                <motion.div
                    key={i}
                    animate={{ opacity: [0.4, 0.7, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                    style={{
                        width: '120px',
                        height: '40px',
                        background: i === 0 ? 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)' : '#e2e8f0',
                        borderRadius: '10px' }}
                />
            ))}
        </motion.div>

        {/* Tools Grid Skeleton */}
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            aria-hidden="true"
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 360px), 1fr))',
                gap: '2rem' }}
        >
            {[...Array(7)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.05, type: 'spring', stiffness: 300 }}
                    style={{
                        height: '404px',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '20px',
                        padding: '2rem',
                        position: 'relative',
                        overflow: 'hidden' }}
                >
                    {/* Shimmer overlay */}
                    <motion.div
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: i * 0.1 }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                            pointerEvents: 'none' }}
                    />
                    {/* Icon skeleton */}
                    <motion.div
                        animate={{ opacity: [0.4, 0.7, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.05 }}
                        style={{
                            width: '52px',
                            height: '52px',
                            background: '#e2e8f0',
                            borderRadius: '14px',
                            marginBottom: '1rem' }}
                    />
                    {/* Title skeleton */}
                    <motion.div
                        animate={{ opacity: [0.4, 0.7, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.05 + 0.1 }}
                        style={{ width: '120px', height: '18px', background: '#e2e8f0', borderRadius: '6px', marginBottom: '0.5rem' }}
                    />
                    {/* Description skeleton */}
                    <motion.div
                        animate={{ opacity: [0.4, 0.7, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.05 + 0.15 }}
                        style={{ width: '100%', height: '14px', background: '#f1f5f9', borderRadius: '4px', marginBottom: '0.375rem' }}
                    />
                    <motion.div
                        animate={{ opacity: [0.4, 0.7, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.05 + 0.2 }}
                        style={{ width: '80%', height: '14px', background: '#f1f5f9', borderRadius: '4px', marginBottom: 'auto' }}
                    />
                    {/* Badge skeleton */}
                    <motion.div
                        animate={{ opacity: [0.4, 0.7, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.05 + 0.25 }}
                        style={{
                            width: '80px',
                            height: '26px',
                            background: '#f0fdf4',
                            borderRadius: '8px',
                            position: 'absolute',
                            bottom: '1.5rem',
                            left: '1.5rem' }}
                    />
                </motion.div>
            ))}
        </motion.div>
    </div>
);


export { CategoryTabs, ToolsSkeleton };
