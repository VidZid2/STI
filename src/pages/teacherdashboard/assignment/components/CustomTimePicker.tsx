import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const CustomTimePicker: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    icon?: React.ReactNode;
}> = ({ label, value, onChange, required, icon }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const timeOptions = useMemo(() => {
        const options = [];
        for (let h = 0; h < 24; h++) {
            for (let m = 0; m < 60; m += 30) {
                const hour = h.toString().padStart(2, '0');
                const minute = m.toString().padStart(2, '0');
                const time24 = `${hour}:${minute}`;
                const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                const ampm = h < 12 ? 'AM' : 'PM';
                const display = `${hour12}:${minute.padStart(2, '0')} ${ampm}`;
                options.push({ value: time24, display });
            }
        }
        return options;
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
                containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const formatDisplayTime = (time24: string) => {
        if (!time24) return 'Select time';
        const [h, m] = time24.split(':').map(Number);
        const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        const ampm = h < 12 ? 'AM' : 'PM';
        return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
    };

    return (
        <div ref={containerRef} style={{ marginBottom: '16px', position: 'relative' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                {icon && <span style={{ color: 'var(--accent-primary)' }}>{icon}</span>}
                {label}
                {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
            </label>

            <motion.button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ borderColor: 'var(--accent-primary)' }}
                style={{
                    width: '100%', padding: '10px 12px', borderRadius: '10px',
                    border: isOpen ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    background: 'var(--bg-surface)', fontSize: '13px',
                    color: value ? 'var(--text-primary)' : 'var(--text-muted)',
                    outline: 'none', cursor: 'pointer', height: '40px', boxSizing: 'border-box',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'all 0.2s ease',
                    boxShadow: isOpen ? '0 0 0 3px var(--ring-focus)' : 'none',
                }}
            >
                <span>{formatDisplayTime(value)}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={dropdownRef}
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        style={{
                            position: 'absolute', top: '100%', left: 0, marginTop: '4px',
                            width: '100%', maxHeight: '200px', overflowY: 'auto',
                            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                            borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 1000,
                        }}
                    >
                        {timeOptions.map((option) => (
                            <motion.button
                                key={option.value}
                                type="button"
                                onClick={() => { onChange(option.value); setIsOpen(false); }}
                                whileHover={{ background: 'var(--accent-bg)' }}
                                style={{
                                    width: '100%', padding: '10px 12px', border: 'none',
                                    background: value === option.value ? 'var(--accent-bg)' : 'transparent',
                                    color: value === option.value ? 'var(--accent-primary)' : 'var(--text-primary)',
                                    fontSize: '13px', fontWeight: value === option.value ? 600 : 400,
                                    cursor: 'pointer', textAlign: 'left',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                }}
                            >
                                {option.display}
                                {value === option.value && (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CustomTimePicker;
