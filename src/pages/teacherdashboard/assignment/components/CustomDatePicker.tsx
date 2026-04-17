import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const CustomDatePicker: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    icon?: React.ReactNode;
    minDate?: string;
}> = ({ label, value, onChange, required, icon, minDate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
    const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
    const containerRef = useRef<HTMLDivElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value) {
            const date = new Date(value);
            setCalendarMonth(date.getMonth());
            setCalendarYear(date.getFullYear());
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(e.target as Node) &&
                containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const formatDisplayDate = (dateStr: string) => {
        if (!dateStr) return 'Select date';
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const minDateObj = minDate ? new Date(minDate) : today;

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
                <span>{formatDisplayDate(value)}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={calendarRef}
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        style={{
                            position: 'absolute', top: '100%', left: 0, marginTop: '4px',
                            width: '260px', background: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)', borderRadius: '12px',
                            padding: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 1000,
                        }}
                    >
                        {/* Month/Year Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <motion.button type="button"
                                onClick={() => { if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(calendarYear - 1); } else { setCalendarMonth(calendarMonth - 1); } }}
                                whileHover={{ scale: 1.1, background: 'var(--accent-bg)' }} whileTap={{ scale: 0.9 }}
                                style={{ width: '28px', height: '28px', border: 'none', borderRadius: '6px', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                            </motion.button>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {new Date(calendarYear, calendarMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </span>
                            <motion.button type="button"
                                onClick={() => { if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(calendarYear + 1); } else { setCalendarMonth(calendarMonth + 1); } }}
                                whileHover={{ scale: 1.1, background: 'var(--accent-bg)' }} whileTap={{ scale: 0.9 }}
                                style={{ width: '28px', height: '28px', border: 'none', borderRadius: '6px', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                            </motion.button>
                        </div>

                        {/* Day Headers */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, i) => (
                                <div key={i} style={{ textAlign: 'center', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', padding: '4px' }}>{day}</div>
                            ))}
                        </div>

                        {/* Calendar Days */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                            {(() => {
                                const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
                                const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                                const days = [];
                                for (let i = 0; i < firstDay; i++) {
                                    days.push(<div key={`empty-${i}`} style={{ width: '32px', height: '32px' }} />);
                                }
                                for (let day = 1; day <= daysInMonth; day++) {
                                    const date = new Date(calendarYear, calendarMonth, day);
                                    const dateStr = date.toISOString().split('T')[0];
                                    const isSelected = value === dateStr;
                                    const isPast = date < minDateObj;
                                    const isToday = date.toDateString() === today.toDateString();
                                    days.push(
                                        <motion.button key={day} type="button"
                                            onClick={() => { if (!isPast) { onChange(dateStr); setIsOpen(false); } }}
                                            whileHover={!isPast ? { scale: 1.1, background: isSelected ? 'var(--accent-primary)' : 'var(--accent-bg)' } : {}}
                                            whileTap={!isPast ? { scale: 0.95 } : {}}
                                            style={{
                                                width: '32px', height: '32px',
                                                border: isToday && !isSelected ? '1.5px solid var(--accent-primary)' : 'none',
                                                borderRadius: '8px',
                                                background: isSelected ? 'var(--accent-primary)' : 'transparent',
                                                color: isSelected ? '#fff' : isPast ? '#cbd5e1' : 'var(--text-primary)',
                                                cursor: isPast ? 'not-allowed' : 'pointer',
                                                fontSize: '12px', fontWeight: isSelected || isToday ? 600 : 400,
                                                opacity: isPast ? 0.5 : 1,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'background 0.15s ease',
                                            }}
                                        >{day}</motion.button>
                                    );
                                }
                                return days;
                            })()}
                        </div>

                        {/* Footer */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                            <motion.button type="button" onClick={() => { onChange(''); setIsOpen(false); }}
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                style={{ flex: 1, padding: '8px', border: '1px solid var(--border-subtle)', borderRadius: '8px', background: 'transparent', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
                            >Clear</motion.button>
                            <motion.button type="button" onClick={() => { onChange(today.toISOString().split('T')[0]); setIsOpen(false); }}
                                whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} whileTap={{ scale: 0.98 }}
                                style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '8px', background: 'var(--accent-primary)', color: '#fff', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
                            >Today</motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CustomDatePicker;
