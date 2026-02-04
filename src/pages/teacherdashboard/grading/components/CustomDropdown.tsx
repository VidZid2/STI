/**
 * CustomDropdown Component
 * Phase 2A: Extracted from GradeSubmissionsModal
 * 
 * A reusable dropdown component with animation and variant support.
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
    value,
    options,
    onChange,
    placeholder = 'Select',
    variant = 'default',
    minWidth = '120px',
    ariaLabel,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find((o) => o.id === value);
    const isPurple = variant === 'purple';
    const accentColor = isPurple ? GRADING_COLORS.purple : GRADING_COLORS.primary;

    return (
        <div
            ref={dropdownRef}
            style={{
                position: 'relative',
                minWidth,
                flex: variant === 'default' ? 1 : undefined,
            }}
        >
            <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setIsOpen(!isOpen)}
                aria-label={ariaLabel || `Select ${placeholder}`}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px',
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    border: isPurple
                        ? `1px solid ${GRADING_COLORS.purpleBorder}`
                        : `1px solid ${GRADING_COLORS.border}`,
                    background: isPurple ? GRADING_COLORS.purpleLight : GRADING_COLORS.surface,
                    color: isPurple ? GRADING_COLORS.purple : GRADING_COLORS.textPrimary,
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                }}
            >
                <span
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {selectedOption?.icon}
                    {selectedOption?.label || placeholder}
                </span>
                <motion.svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
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
                        initial={{ opacity: 0, y: -6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.96 }}
                        transition={{ duration: 0.12 }}
                        role="listbox"
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 4px)',
                            left: 0,
                            minWidth: '100%',
                            background: GRADING_COLORS.surface,
                            borderRadius: '10px',
                            border: `1px solid ${GRADING_COLORS.border}`,
                            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
                            padding: '4px',
                            zIndex: 1000,
                        }}
                    >
                        {options.map((option) => {
                            const isSelected = option.id === value;
                            return (
                                <motion.button
                                    key={option.id}
                                    role="option"
                                    aria-selected={isSelected}
                                    whileHover={{
                                        background: isSelected ? `${accentColor}15` : 'rgba(0,0,0,0.03)',
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        onChange(option.id);
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        width: '100%',
                                        padding: '8px 10px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: isSelected ? `${accentColor}10` : 'transparent',
                                        color: isSelected ? accentColor : '#475569',
                                        fontSize: '12px',
                                        fontWeight: isSelected ? 600 : 500,
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'background 0.1s ease',
                                    }}
                                >
                                    {option.icon && (
                                        <span
                                            style={{
                                                color: isSelected
                                                    ? accentColor
                                                    : isPurple && option.id === 'smart'
                                                    ? GRADING_COLORS.orange
                                                    : GRADING_COLORS.textSecondary,
                                                display: 'flex',
                                                alignItems: 'center',
                                            }}
                                        >
                                            {option.icon}
                                        </span>
                                    )}
                                    <span
                                        style={{
                                            flex: 1,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {option.label}
                                    </span>
                                    {isSelected && (
                                        <motion.svg
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke={accentColor}
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
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
