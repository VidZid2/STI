import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const FormSelect: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    required?: boolean;
    icon?: React.ReactNode;
    placeholder?: string;
}> = ({ label, value, onChange, options, required, icon, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const selectedOption = options.find(opt => opt.value === value);
    const displayLabel = selectedOption?.label || placeholder || 'Select...';

    return (
        <div ref={containerRef} style={{ marginBottom: '16px', position: 'relative' }}>
            <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary mb-1.5">
                {icon && <span className="text-accent">{icon}</span>}
                {label}
                {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
            </label>

            <motion.button
                type="button"
                whileTap={{ scale: 0.99 }}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between gap-2 w-full bg-surface text-[13px] font-medium cursor-pointer transition-all duration-200"
                style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: isOpen ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    height: '40px',
                    boxSizing: 'border-box',
                    boxShadow: isOpen ? '0 0 0 3px var(--ring-focus)' : 'none',
                }}
            >
                <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left" style={{ color: value ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {displayLabel}
                </span>
                <motion.svg
                    width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="var(--text-secondary)" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ flexShrink: 0 }}
                >
                    <polyline points="6 9 12 15 18 9" />
                </motion.svg>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                        className="bg-surface border border-border-subtle"
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 6px)',
                            left: 0, right: 0,
                            minWidth: '100%',
                            borderRadius: '12px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.12), 0 2px 10px rgba(0,0,0,0.06)',
                            padding: '6px',
                            zIndex: 1000,
                            maxHeight: '280px',
                            overflowY: 'auto',
                        }}
                    >
                        {placeholder && (
                            <motion.button
                                type="button"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                onMouseEnter={() => setHoveredId('__placeholder__')}
                                onMouseLeave={() => setHoveredId(null)}
                                onClick={() => { onChange(''); setIsOpen(false); }}
                                className="flex items-center gap-2.5 w-full text-[13px] cursor-pointer text-left transition-colors duration-150"
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: !value ? 'var(--accent-bg)' : hoveredId === '__placeholder__' ? 'var(--bg-surface-alt)' : 'transparent',
                                    color: !value ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                    fontWeight: !value ? 600 : 500,
                                }}
                            >
                                <span style={{ flex: 1 }}>{placeholder}</span>
                                {!value && (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                                        className="w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0"
                                        style={{ background: 'var(--accent-primary)' }}
                                    >
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </motion.div>
                                )}
                            </motion.button>
                        )}
                        {options.map((option, index) => {
                            const isSelected = value === option.value;
                            const isHovered = hoveredId === option.value;
                            return (
                                <motion.button
                                    key={option.value}
                                    type="button"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                    onMouseEnter={() => setHoveredId(option.value)}
                                    onMouseLeave={() => setHoveredId(null)}
                                    onClick={() => { onChange(option.value); setIsOpen(false); }}
                                    className="flex items-center gap-2.5 w-full text-[13px] cursor-pointer text-left transition-colors duration-150"
                                    style={{
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: isSelected ? 'var(--accent-bg)' : isHovered ? 'var(--bg-surface-alt)' : 'transparent',
                                        color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                                        fontWeight: isSelected ? 600 : 500,
                                    }}
                                >
                                    <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{option.label}</span>
                                    {isSelected && (
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                                            className="w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0"
                                            style={{ background: 'var(--accent-primary)' }}
                                        >
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </motion.div>
                                    )}
                                </motion.button>
                            );
                        })}
                        {options.length === 0 && (
                            <div className="text-center text-text-secondary text-[12px]" style={{ padding: '16px 12px' }}>
                                No options available
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FormSelect;
