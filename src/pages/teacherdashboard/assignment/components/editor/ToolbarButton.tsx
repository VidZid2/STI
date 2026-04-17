/**
 * ToolbarButton — Reusable toolbar button with animated tooltip.
 * Extracted from RichTextEditor.tsx (safe decomposition).
 * Zero style changes — exact same styles, just moved to its own file.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ToolbarButtonProps {
    title: string;
    isActive?: boolean;
    onClick: () => void;
    children: React.ReactNode;
    tooltipRight?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
    title,
    isActive,
    onClick,
    children,
    tooltipRight,
}) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <motion.button
                type="button"
                initial={false}
                animate={{
                    background: isActive ? 'var(--accent-bg)' : 'transparent',
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                }}
                whileHover={{
                    background: 'var(--accent-bg)',
                    scale: 1.05,
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={onClick}
                style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '7px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {children}
            </motion.button>
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 2 }}
                        transition={{ duration: 0.15, ease: 'easeOut', delay: 0.1 }}
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 6px)',
                            ...(tooltipRight ? { right: 0 } : { left: 0, right: 0 }),
                            display: 'flex',
                            justifyContent: tooltipRight ? 'flex-end' : 'center',
                            pointerEvents: 'none',
                            zIndex: 1000,
                        }}
                    >
                        <div style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            background: 'var(--bg-surface)',
                            color: 'var(--accent-primary)',
                            fontSize: '11px',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        }}>
                            {title}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ToolbarButton;
