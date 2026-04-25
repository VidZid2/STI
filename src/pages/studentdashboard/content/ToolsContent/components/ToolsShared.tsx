/**
 * ToolsShared - CategoryTabs + ToolsSkeleton
 * Shared UI components for ToolsContent.
 * Extracted from ToolsContent.tsx during Phase 8.7
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';

// Premium Category Tabs Component with Sliding Indicator
interface CategoryTabsProps {
    categories: { id: string; name: string; icon: string }[];
    activeCategory: string;
    onCategoryChange: (id: string) => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ categories, activeCategory, onCategoryChange }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [tabDimensions, setTabDimensions] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
    const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

    // Update indicator position when active category changes
    const updateIndicator = useCallback(() => {
        const activeTab = tabRefs.current.get(activeCategory);
        const container = containerRef.current;
        if (activeTab && container) {
            const containerRect = container.getBoundingClientRect();
            const tabRect = activeTab.getBoundingClientRect();
            setTabDimensions({
                left: tabRect.left - containerRect.left,
                width: tabRect.width });
        }
    }, [activeCategory]);

    useEffect(() => {
        updateIndicator();
        // Also update on window resize
        window.addEventListener('resize', updateIndicator);
        return () => window.removeEventListener('resize', updateIndicator);
    }, [updateIndicator]);

    // Initial measurement after mount
    useEffect(() => {
        const timer = setTimeout(updateIndicator, 50);
        return () => clearTimeout(timer);
    }, [updateIndicator]);

    return (
        <motion.div
            ref={containerRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
            style={{
                position: 'relative',
                display: 'flex',
                gap: '0.25rem',
                marginBottom: '2rem',
                padding: '0.375rem',
                background: '#f1f5f9',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                width: 'fit-content' }}
            className="category-tabs-container"
        >
            {/* Sliding Background Indicator */}
            <motion.div
                style={{
                    position: 'absolute',
                    top: '0.375rem',
                    bottom: '0.375rem',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    borderRadius: '10px',
                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.35)',
                    zIndex: 0 }}
                initial={false}
                animate={{
                    left: tabDimensions.left,
                    width: tabDimensions.width }}
                transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 35,
                    mass: 0.8 }}
            />

            {categories.map((category, idx) => (
                <motion.button
                    key={category.id}
                    ref={(el) => {
                        if (el) tabRefs.current.set(category.id, el);
                    }}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + idx * 0.05, type: 'spring', stiffness: 300 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onCategoryChange(category.id)}
                    style={{
                        position: 'relative',
                        zIndex: 1,
                        padding: '0.625rem 1.25rem',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'transparent',
                        fontWeight: 500,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        whiteSpace: 'nowrap' }}
                >
                    <motion.span
                        style={{ fontSize: '1rem', display: 'flex' }}
                        animate={{
                            scale: activeCategory === category.id ? 1.15 : 1,
                            filter: activeCategory === category.id ? 'brightness(1.2)' : 'brightness(1)' }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    >
                        {category.icon}
                    </motion.span>
                    <motion.span
                        animate={{
                            color: activeCategory === category.id ? '#ffffff' : '#64748b',
                            fontWeight: activeCategory === category.id ? 600 : 500 }}
                        transition={{ duration: 0.2 }}
                    >
                        {category.name}
                    </motion.span>
                </motion.button>
            ))}
        </motion.div>
    );
};


// Premium Skeleton Loading Component for Tools
const ToolsSkeleton: React.FC = () => (
    <div className="tools-content">
        {/* Hero Section Skeleton - Two Cards Layout */}
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '2rem',
                alignItems: 'stretch' }}
        >
            {/* Main Hero Card Skeleton */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '20px',
                    padding: '2rem 2.5rem',
                    position: 'relative',
                    overflow: 'hidden' }}
            >
                {/* Shimmer overlay */}
                <motion.div
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                        pointerEvents: 'none' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    {/* Icon skeleton */}
                    <motion.div
                        animate={{ opacity: [0.4, 0.7, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        style={{
                            width: '72px',
                            height: '72px',
                            borderRadius: '20px',
                            background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)' }}
                    />
                    <div style={{ flex: 1 }}>
                        {/* Label skeleton */}
                        <motion.div
                            animate={{ opacity: [0.4, 0.7, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
                            style={{ width: '100px', height: '14px', background: '#e2e8f0', borderRadius: '6px', marginBottom: '0.5rem' }}
                        />
                        {/* Title skeleton */}
                        <motion.div
                            animate={{ opacity: [0.4, 0.7, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.15 }}
                            style={{ width: '180px', height: '28px', background: '#cbd5e1', borderRadius: '8px', marginBottom: '0.5rem' }}
                        />
                        {/* Description skeleton */}
                        <motion.div
                            animate={{ opacity: [0.4, 0.7, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                            style={{ width: '280px', height: '16px', background: '#e2e8f0', borderRadius: '6px', marginBottom: '1rem' }}
                        />
                        {/* Feature pills skeleton */}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {[0, 1, 2].map(i => (
                                <motion.div
                                    key={i}
                                    animate={{ opacity: [0.4, 0.7, 0.4] }}
                                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.25 + i * 0.05 }}
                                    style={{
                                        width: '100px',
                                        height: '48px',
                                        background: '#f1f5f9',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '10px' }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Stats Card Skeleton */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                style={{
                    width: '280px',
                    background: 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)',
                    borderRadius: '20px',
                    padding: '1.5rem',
                    position: 'relative',
                    overflow: 'hidden',
                    flexShrink: 0 }}
            >
                {/* Shimmer overlay */}
                <motion.div
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: 0.3 }}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                        pointerEvents: 'none' }}
                />
                {/* Header skeleton */}
                <motion.div
                    animate={{ opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ width: '80px', height: '14px', background: 'rgba(255,255,255,0.3)', borderRadius: '6px', marginBottom: '1rem' }}
                />
                {/* Stats grid skeleton */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    {[0, 1].map(i => (
                        <div key={i} style={{ textAlign: 'center' }}>
                            <motion.div
                                animate={{ opacity: [0.3, 0.5, 0.3] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                                style={{ width: '50px', height: '32px', background: 'rgba(255,255,255,0.3)', borderRadius: '8px', margin: '0 auto 0.25rem' }}
                            />
                            <motion.div
                                animate={{ opacity: [0.3, 0.5, 0.3] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 + 0.05 }}
                                style={{ width: '40px', height: '10px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', margin: '0 auto' }}
                            />
                        </div>
                    ))}
                </div>
                {/* Badge skeleton */}
                <motion.div
                    animate={{ opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                    style={{ width: '100%', height: '40px', background: 'rgba(255,255,255,0.15)', borderRadius: '10px' }}
                />
            </motion.div>
        </motion.div>

        {/* Category Tabs Skeleton */}
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
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
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.25rem' }}
        >
            {[...Array(7)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.05, type: 'spring', stiffness: 300 }}
                    style={{
                        height: '220px',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '20px',
                        padding: '1.5rem',
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
