/**
 * CustomDropdown Component
 * Phase 2A: Extracted from GradeSubmissionsModal
 * Migrated: inline styles → Tailwind + CSS variables
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GRADING_COLORS } from '../constants';

export interface DropdownOption {
    id: string;
    label: string;
    icon?: React.ReactNode;
}

export interface CustomDropdownProps {
    value: string;
    options: DropdownOption[];
    onChange: (value: string) => void;
    placeholder?: string;
    variant?: 'default' | 'purple';
    minWidth?: string;
    ariaLabel?: string;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
    value, options, onChange,
    placeholder = 'Select',
    variant = 'default',
    minWidth = '120px',
    ariaLabel,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find((o) => o.id === value);
    const isPurple = variant === 'purple';
    const accentColor = isPurple ? GRADING_COLORS.purple : GRADING_COLORS.primary;

    return (
        <div ref={dropdownRef} className="relative" style={{ minWidth, flex: variant === 'default' ? 1 : undefined }}>
            <motion.button
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                onClick={() => setIsOpen(!isOpen)}
                aria-label={ariaLabel || `Select ${placeholder}`}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                className="flex items-center justify-between gap-1.5 w-full px-2.5 py-[7px] rounded-lg text-xs font-medium cursor-pointer transition-all"
                style={{
                    border: isPurple ? `1px solid ${GRADING_COLORS.purpleBorder}` : '1px solid var(--border-subtle)',
                    background: isPurple ? GRADING_COLORS.purpleLight : 'var(--bg-surface)',
                    color: isPurple ? GRADING_COLORS.purple : 'var(--text-primary)',
                }}
            >
                <span className="flex items-center gap-[5px] overflow-hidden text-ellipsis whitespace-nowrap">
                    {selectedOption?.icon}
                    {selectedOption?.label || placeholder}
                </span>
                <motion.svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
                    <polyline points="6 9 12 15 18 9" />
                </motion.svg>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.96 }}
                        transition={{ duration: 0.12 }}
                        role="listbox"
                        className="absolute top-[calc(100%+4px)] left-0 min-w-full rounded-[10px] p-1 z-[1000]"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', boxShadow: '0 6px 20px rgba(0,0,0,0.1)' }}
                    >
                        {options.map((option) => {
                            const isSelected = option.id === value;
                            return (
                                <motion.button
                                    key={option.id}
                                    role="option"
                                    aria-selected={isSelected}
                                    whileHover={{ background: isSelected ? `${accentColor}15` : 'rgba(0,0,0,0.03)' }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => { onChange(option.id); setIsOpen(false); }}
                                    className="flex items-center gap-2 w-full px-2.5 py-2 rounded-md border-none text-xs cursor-pointer text-left transition-colors"
                                    style={{
                                        background: isSelected ? `${accentColor}10` : 'transparent',
                                        color: isSelected ? accentColor : 'var(--text-secondary)',
                                        fontWeight: isSelected ? 600 : 500,
                                    }}
                                >
                                    {option.icon && (
                                        <span className="flex items-center" style={{
                                            color: isSelected ? accentColor
                                                : isPurple && option.id === 'smart' ? GRADING_COLORS.orange
                                                : 'var(--text-secondary)',
                                        }}>
                                            {option.icon}
                                        </span>
                                    )}
                                    <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{option.label}</span>
                                    {isSelected && (
                                        <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }}
                                            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </motion.svg>
                                    )}
                                </motion.button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CustomDropdown;
