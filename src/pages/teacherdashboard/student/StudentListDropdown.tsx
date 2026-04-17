import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const StudentListDropdown: React.FC<{
    value: string;
    options: { id: string; label: string; icon?: React.ReactNode }[];
    onChange: (value: string) => void;
    placeholder?: string;
    minWidth?: string;
}> = ({ value, options, onChange, placeholder = 'Select', minWidth = '120px' }) => {
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

    return (
        <div ref={dropdownRef} style={{ position: 'relative', minWidth, flex: 1 }}>
            <motion.button
                whileTap={{ scale: 0.99 }}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: isOpen ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isOpen ? '0 0 0 3px var(--ring-focus)' : 'none',
                }}
            >
                <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: selectedOption ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}>
                    {selectedOption?.icon}
                    {selectedOption?.label || placeholder}
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
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 6px)',
                            left: 0, right: 0,
                            minWidth: '100%',
                            background: 'var(--bg-surface)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-subtle)',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.15), 0 2px 10px rgba(0,0,0,0.08)',
                            padding: '6px',
                            zIndex: 1000,
                            maxHeight: '280px',
                            overflowY: 'auto',
                        }}
                    >
                        {options.map((option, index) => {
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
                                    onClick={() => { onChange(option.id); setIsOpen(false); }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: isSelected
                                            ? 'var(--accent-bg)'
                                            : isHovered
                                                ? 'var(--bg-surface-alt)'
                                                : 'transparent',
                                        color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                                        fontSize: '13px',
                                        fontWeight: isSelected ? 600 : 500,
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'background 0.15s ease',
                                    }}
                                >
                                    {option.icon && (
                                        <span style={{ color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                                            {option.icon}
                                        </span>
                                    )}
                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {option.label}
                                    </span>
                                    {isSelected && (
                                        <motion.div
                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                            style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                                        >
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </motion.div>
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

export default StudentListDropdown;
