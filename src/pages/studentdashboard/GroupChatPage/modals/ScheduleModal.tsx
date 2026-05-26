/**
 * Schedule Session Modal Component
 * Minimalistic professional design with custom date/time pickers
 * Blue accent color scheme matching GoalsContent timer modal
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import type { ModalColors } from './types';

interface ScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (title: string, date: string, time: string) => void;
    colors: ModalColors;
}

// Custom Calendar Picker Component
const CalendarPicker: React.FC<{
    selectedDate: Date | null;
    onSelect: (date: Date) => void;
    onClose: () => void;
    isDarkMode: boolean;
    colors: { textPrimary: string; textSecondary: string; textMuted: string };
}> = ({ selectedDate, onSelect, onClose, isDarkMode, colors }) => {
    const [viewDate, setViewDate] = useState(selectedDate || new Date());
    const blueAccent = '#3b82f6';
    const blueBg = isDarkMode ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)';
    const borderColor = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
    const cardBg = isDarkMode ? '#1e293b' : '#ffffff';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days: (Date | null)[] = [];
        
        // Add empty slots for days before first day
        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }
        // Add all days in month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };


    const days = getDaysInMonth(viewDate);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];

    const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

    const isSelected = (date: Date | null) => {
        if (!date || !selectedDate) return false;
        return date.toDateString() === selectedDate.toDateString();
    };

    const isToday = (date: Date | null) => {
        if (!date) return false;
        return date.toDateString() === today.toDateString();
    };

    const isPast = (date: Date | null) => {
        if (!date) return false;
        return date < today;
    };

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
                zIndex: 1002, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: cardBg, borderRadius: '16px', padding: '20px',
                    width: '320px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                }}
            >
                {/* Month Navigation */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <motion.button
                        whileHover={{ scale: 1.1, background: blueBg }}
                        whileTap={{ scale: 0.95 }}
                        onClick={prevMonth}
                        style={{
                            width: 32, height: 32, borderRadius: '8px', border: 'none',
                            background: 'transparent', cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', color: colors.textSecondary,
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </motion.button>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: colors.textPrimary }}>
                        {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                    </span>
                    <motion.button
                        whileHover={{ scale: 1.1, background: blueBg }}
                        whileTap={{ scale: 0.95 }}
                        onClick={nextMonth}
                        style={{
                            width: 32, height: 32, borderRadius: '8px', border: 'none',
                            background: 'transparent', cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', color: colors.textSecondary,
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </motion.button>
                </div>


                {/* Day Headers */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div key={i} style={{
                            textAlign: 'center', fontSize: '11px', fontWeight: 600,
                            color: colors.textMuted, padding: '4px',
                        }}>
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                    {days.map((date, i) => (
                        <motion.button
                            key={i}
                            whileHover={date && !isPast(date) ? { scale: 1.1 } : {}}
                            whileTap={date && !isPast(date) ? { scale: 0.95 } : {}}
                            onClick={() => date && !isPast(date) && onSelect(date)}
                            disabled={!date || isPast(date)}
                            style={{
                                width: '100%', aspectRatio: '1', borderRadius: '10px',
                                border: isToday(date) ? `2px solid ${blueAccent}` : 'none',
                                background: isSelected(date) ? blueAccent : 'transparent',
                                cursor: date && !isPast(date) ? 'pointer' : 'default',
                                fontSize: '13px', fontWeight: isSelected(date) || isToday(date) ? 600 : 500,
                                color: isSelected(date) ? '#fff' : isPast(date) ? colors.textMuted : colors.textPrimary,
                                opacity: date ? 1 : 0,
                                transition: 'background 0.15s ease',
                            }}
                        >
                            {date?.getDate()}
                        </motion.button>
                    ))}
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${borderColor}` }}>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { onSelect(new Date()); }}
                        style={{
                            flex: 1, padding: '10px', borderRadius: '10px',
                            border: `1px solid ${borderColor}`, background: 'transparent',
                            cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: colors.textSecondary,
                        }}
                    >
                        Clear
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onClose}
                        style={{
                            flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                            background: blueAccent, cursor: 'pointer',
                            fontSize: '13px', fontWeight: 600, color: '#fff',
                        }}
                    >
                        Done
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
};


// Custom Number Stepper Component (like goal timer)
const NumberStepper: React.FC<{
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    label: string;
    isDarkMode: boolean;
    format?: (value: number) => string;
    colors: { textPrimary: string; textSecondary: string; textMuted: string };
}> = ({ value, onChange, min, max, label, isDarkMode, format, colors }) => {
    const subtleBg = isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
    const borderColor = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

    const increment = () => onChange(Math.min(max, value + 1));
    const decrement = () => onChange(Math.max(min, value - 1));

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '0',
            background: subtleBg, borderRadius: '12px', padding: '4px',
            border: `1px solid ${borderColor}`,
        }}>
            <motion.button
                whileHover={{ scale: 1.05, background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
                whileTap={{ scale: 0.95 }}
                onClick={decrement}
                disabled={value <= min}
                style={{
                    width: 36, height: 36, borderRadius: '8px', border: 'none',
                    background: 'transparent', cursor: value > min ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: value > min ? colors.textSecondary : colors.textMuted,
                    transition: 'background 0.15s ease',
                }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
            </motion.button>
            <div style={{
                flex: 1, textAlign: 'center', minWidth: '70px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
            }}>
                <span style={{ fontSize: '18px', fontWeight: 700, color: colors.textPrimary }}>
                    {format ? format(value) : value}
                </span>
                <span style={{ fontSize: '10px', fontWeight: 500, color: colors.textMuted, textTransform: 'lowercase' }}>
                    {label}
                </span>
            </div>
            <motion.button
                whileHover={{ scale: 1.05, background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
                whileTap={{ scale: 0.95 }}
                onClick={increment}
                disabled={value >= max}
                style={{
                    width: 36, height: 36, borderRadius: '8px', border: 'none',
                    background: 'transparent', cursor: value < max ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: value < max ? colors.textSecondary : colors.textMuted,
                    transition: 'background 0.15s ease',
                }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
            </motion.button>
        </div>
    );
};


export const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose, onSend, colors }) => {
    const [title, setTitle] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [hour, setHour] = useState(9);
    const [minute, setMinute] = useState(0);
    const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
    const [showCalendar, setShowCalendar] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);

    // Blue accent colors
    const blueAccent = '#3b82f6';
    const isDarkMode = colors.cardBg === '#1e293b' || colors.cardBg.includes('30, 41, 59');
    const blueBg = isDarkMode ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)';
    const blueBorder = isDarkMode ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.15)';
    const subtleBg = isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
    const borderColor = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => titleInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const formatDateDisplay = (date: Date | null) => {
        if (!date) return 'Select';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const formatTimeDisplay = () => {
        const h = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${h}:${minute.toString().padStart(2, '0')} ${period}`;
    };

    const handleSubmit = () => {
        if (title.trim() && selectedDate) {
            const dateStr = selectedDate.toISOString().split('T')[0];
            const hour24 = period === 'PM' ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour);
            const timeStr = `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            onSend(title.trim(), dateStr, timeStr);
            setTitle('');
            setSelectedDate(null);
            setHour(9);
            setMinute(0);
            setPeriod('AM');
            onClose();
        }
    };

    const isValid = title.trim() && selectedDate;

    if (!isOpen) return null;


    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                    style={{
                        position: 'fixed', inset: 0,
                        background: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(8px)', zIndex: 1001,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: colors.cardBg, borderRadius: '20px',
                            width: '100%', maxWidth: '440px',
                            boxShadow: isDarkMode
                                ? '0 24px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)'
                                : '0 24px 48px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '20px 24px', borderBottom: `1px solid ${borderColor}`,
                            display: 'flex', alignItems: 'center', gap: '14px',
                        }}>
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 25 }}
                                style={{
                                    width: 44, height: 44, borderRadius: '12px',
                                    background: blueBg, border: `1px solid ${blueBorder}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={blueAccent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                            </motion.div>
                            <div style={{ flex: 1 }}>
                                <motion.h3 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
                                    style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: colors.textPrimary, letterSpacing: '-0.01em' }}>
                                    Schedule Study Session
                                </motion.h3>
                                <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                                    style={{ margin: '4px 0 0', fontSize: '12px', color: colors.textSecondary }}>
                                    Plan a group study session
                                </motion.p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1, background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onClose}
                                style={{
                                    width: 32, height: 32, borderRadius: '10px', border: 'none',
                                    background: subtleBg, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textSecondary,
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </motion.button>
                        </div>


                        {/* Content */}
                        <div style={{ padding: '20px 24px' }}>
                            {/* Preview Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                style={{
                                    background: `linear-gradient(135deg, ${blueAccent} 0%, #2563eb 100%)`,
                                    borderRadius: '14px', padding: '16px 18px', marginBottom: '20px',
                                    boxShadow: '0 4px 16px rgba(59, 130, 246, 0.25)',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: '10px',
                                        background: 'rgba(255,255,255,0.2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <polyline points="12 6 12 12 16 14" />
                                        </svg>
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
                                            {title || 'Session Title'}
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                    <line x1="16" y1="2" x2="16" y2="6" />
                                                    <line x1="8" y1="2" x2="8" y2="6" />
                                                    <line x1="3" y1="10" x2="21" y2="10" />
                                                </svg>
                                                {selectedDate ? formatDateDisplay(selectedDate) : 'Select date'}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <polyline points="12 6 12 12 16 14" />
                                                </svg>
                                                {formatTimeDisplay()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Title Input */}
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    fontSize: '11px', fontWeight: 600, marginBottom: '8px',
                                    color: focusedField === 'title' ? blueAccent : colors.textSecondary,
                                    textTransform: 'uppercase', letterSpacing: '0.5px',
                                }}>
                                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: focusedField === 'title' ? blueAccent : colors.textMuted }} />
                                    Session Title
                                </label>
                                <input
                                    ref={titleInputRef}
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onFocus={() => setFocusedField('title')}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder="Chapter 5 Review"
                                    style={{
                                        width: '100%', padding: '12px 14px', borderRadius: '12px',
                                        border: `1px solid ${focusedField === 'title' ? blueBorder : borderColor}`,
                                        background: focusedField === 'title' ? blueBg : subtleBg,
                                        fontSize: '14px', outline: 'none', color: colors.textPrimary, fontFamily: 'inherit',
                                        transition: 'all 0.2s ease',
                                        boxShadow: focusedField === 'title' ? `0 0 0 3px ${blueBg}` : 'none',
                                    }}
                                />
                            </motion.div>


                            {/* Date Picker */}
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    fontSize: '11px', fontWeight: 600, marginBottom: '8px',
                                    color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px',
                                }}>
                                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: colors.textMuted }} />
                                    Date
                                </label>
                                <motion.button
                                    whileHover={{ scale: 1.01, borderColor: blueBorder }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={() => setShowCalendar(true)}
                                    style={{
                                        width: '100%', padding: '12px 14px', borderRadius: '12px',
                                        border: `1px solid ${borderColor}`, background: subtleBg,
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <span style={{ fontSize: '14px', fontWeight: 500, color: selectedDate ? colors.textPrimary : colors.textMuted }}>
                                        {selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Select a date'}
                                    </span>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={blueAccent} strokeWidth="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                </motion.button>
                            </motion.div>

                            {/* Time Picker */}
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    fontSize: '11px', fontWeight: 600, marginBottom: '10px',
                                    color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px',
                                }}>
                                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: colors.textMuted }} />
                                    Time
                                </label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <NumberStepper
                                        value={hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}
                                        onChange={(v) => setHour(period === 'PM' ? (v === 12 ? 12 : v + 12) : (v === 12 ? 0 : v))}
                                        min={1} max={12} label="hour"
                                        isDarkMode={isDarkMode} colors={colors}
                                    />
                                    <NumberStepper
                                        value={minute}
                                        onChange={setMinute}
                                        min={0} max={59} label="min"
                                        format={(v) => v.toString().padStart(2, '0')}
                                        isDarkMode={isDarkMode} colors={colors}
                                    />
                                    <div style={{
                                        display: 'flex', flexDirection: 'column', gap: '4px',
                                        background: subtleBg, borderRadius: '12px', padding: '4px',
                                        border: `1px solid ${borderColor}`,
                                    }}>
                                        {(['AM', 'PM'] as const).map((p) => (
                                            <motion.button
                                                key={p}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setPeriod(p)}
                                                style={{
                                                    padding: '8px 14px', borderRadius: '8px', border: 'none',
                                                    background: period === p ? blueAccent : 'transparent',
                                                    cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                                                    color: period === p ? '#fff' : colors.textSecondary,
                                                    transition: 'all 0.15s ease',
                                                }}
                                            >
                                                {p}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </div>


                        {/* Footer */}
                        <div style={{
                            padding: '16px 24px 20px', borderTop: `1px solid ${borderColor}`,
                            display: 'flex', gap: '10px', justifyContent: 'flex-end', background: subtleBg,
                        }}>
                            <motion.button
                                whileHover={{ scale: 1.02, background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                style={{
                                    padding: '10px 18px', borderRadius: '10px',
                                    border: `1px solid ${borderColor}`, background: 'transparent',
                                    cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: colors.textSecondary,
                                }}
                            >
                                Cancel
                            </motion.button>
                            <motion.button
                                whileHover={isValid ? { scale: 1.02, boxShadow: '0 4px 16px rgba(59, 130, 246, 0.35)' } : {}}
                                whileTap={isValid ? { scale: 0.98 } : {}}
                                onClick={handleSubmit}
                                disabled={!isValid}
                                style={{
                                    padding: '10px 20px', borderRadius: '10px', border: 'none',
                                    background: isValid
                                        ? `linear-gradient(135deg, ${blueAccent} 0%, #2563eb 100%)`
                                        : isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                                    cursor: isValid ? 'pointer' : 'not-allowed',
                                    fontSize: '13px', fontWeight: 600,
                                    color: isValid ? '#fff' : colors.textMuted,
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    boxShadow: isValid ? '0 2px 8px rgba(59, 130, 246, 0.25)' : 'none',
                                }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                Schedule Session
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* Calendar Popup */}
                    <AnimatePresence>
                        {showCalendar && (
                            <CalendarPicker
                                selectedDate={selectedDate}
                                onSelect={(date) => { setSelectedDate(date); setShowCalendar(false); }}
                                onClose={() => setShowCalendar(false)}
                                isDarkMode={isDarkMode}
                                colors={colors}
                            />
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};
    