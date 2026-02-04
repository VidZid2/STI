/**
 * Custom Dropdown Component - Minimalistic Blue Design
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomDropdownProps {
    value: string;
    options: { id: string; label: string }[];
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    label?: string;
    isLoading?: boolean;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({ 
    value, 
    options, 
    onChange, 
    placeholder = 'Select', 
    disabled = false, 
    label, 
    isLoading = false 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.id === value);
    const isDisabled = disabled || isLoading;

    return (
        <div ref={dropdownRef} style={{ position: 'relative', flex: 1 }}>
            {label && (
                <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#64748b',
                    marginBottom: '8px',
                }}>
                    {label}
                </label>
            )}
            
            <motion.button
                whileTap={isDisabled ? {} : { scale: 0.99 }}
                onClick={() => !isDisabled && setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: isOpen 
                        ? '1px solid rgba(59, 130, 246, 0.4)' 
                        : '1px solid rgba(0,0,0,0.08)',
                    background: isDisabled ? 'rgba(0,0,0,0.02)' : '#ffffff',
                    color: selectedOption ? '#0f172a' : '#94a3b8',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isOpen ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
                    opacity: isDisabled ? 0.6 : 1,
                }}
            >
                <span style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap',
                }}>
                    {isLoading && (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            style={{ display: 'flex', alignItems: 'center' }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                                <path d="M21 12a9 9 0 11-6.219-8.56" />
                            </svg>
                        </motion.div>
                    )}
                    {isLoading ? 'Loading...' : (selectedOption?.label || placeholder)}
                </span>
                <motion.svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94a3b8"
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
                {isOpen && !isDisabled && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 6px)',
                            left: 0,
                            right: 0,
                            background: '#ffffff',
                            borderRadius: '12px',
                            border: '1px solid rgba(0,0,0,0.08)',
                            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12), 0 2px 10px rgba(0, 0, 0, 0.06)',
                            padding: '6px',
                            zIndex: 1000,
                            maxHeight: '240px',
                            overflowY: 'auto',
                        }}
                    >
                        {options.length === 0 ? (
                            <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                                No options available
                            </div>
                        ) : (
                            options.map((option, index) => {
                                const isSelected = option.id === value;
                                const isHovered = hoveredId === option.id;
                                
                                return (
                                    <motion.button
                                        key={option.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.02 }}
                                        onMouseEnter={() => setHoveredId(option.id)}
                                        onMouseLeave={() => setHoveredId(null)}
                                        onClick={() => {
                                            onChange(option.id);
                                            setIsOpen(false);
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            width: '100%',
                                            padding: '10px 12px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: isSelected 
                                                ? 'rgba(59, 130, 246, 0.1)' 
                                                : isHovered 
                                                    ? 'rgba(0,0,0,0.03)' 
                                                    : 'transparent',
                                            color: isSelected ? '#3b82f6' : '#334155',
                                            fontSize: '14px',
                                            fontWeight: isSelected ? 600 : 500,
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'background 0.15s ease',
                                        }}
                                    >
                                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {option.label}
                                        </span>
                                        {isSelected && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                style={{
                                                    width: '18px',
                                                    height: '18px',
                                                    borderRadius: '50%',
                                                    background: '#3b82f6',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </motion.div>
                                        )}
                                    </motion.button>
                                );
                            })
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CustomDropdown;
