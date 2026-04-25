/**
 * CreateGoalModal
 * Multi-step goal creation wizard.
 * Extracted from GoalsContent.tsx during Phase 8.3
 */
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useModalAccessibility } from '../../../hooks/useModalAccessibility';
import {
    goalTypeConfig,
    getCurrentAbsoluteValue,
    type Goal,
    type GoalType,
    type GoalPriority,
    type GoalStatus,
} from '../../../../../services/goalsService';
import { COURSES_DATA } from '../../../../../services/pathsService';
import { GoalTypeIcons, PriorityIcons } from '../shared';

type NewGoalData = Omit<Goal, 'id' | 'student_id' | 'created_at' | 'updated_at'>;

const CreateGoalModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onCreate: (goal: NewGoalData) => void;
}> = ({ isOpen, onClose, onCreate }) => {
    const { modalRef, modalProps } = useModalAccessibility(isOpen, onClose, 'create-goal-title');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<GoalType>('study_time');
    const [targetValue, setTargetValue] = useState(10);
    const [priority, setPriority] = useState<GoalPriority>('medium');
    const [endDate, setEndDate] = useState('');
    const [reminder, setReminder] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
    const [isEditingTarget, setIsEditingTarget] = useState(false);
    const [tempTargetValue, setTempTargetValue] = useState('');
    const [showCalendar, setShowCalendar] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
    const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
    const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });
    const calendarRef = React.useRef<HTMLDivElement>(null);
    const dateInputRef = React.useRef<HTMLDivElement>(null);
    
    // Click outside handler for calendar
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node) &&
                dateInputRef.current && !dateInputRef.current.contains(event.target as Node)) {
                setShowCalendar(false);
            }
        };
        
        if (showCalendar) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCalendar]);
    
    // Update calendar position when showing
    useEffect(() => {
        if (showCalendar && dateInputRef.current) {
            const rect = dateInputRef.current.getBoundingClientRect();
            setCalendarPosition({
                top: rect.top,
                left: rect.right + 12,
            });
        }
    }, [showCalendar]);
    
    // Get courses list
    const coursesList = Object.values(COURSES_DATA);

    const colors = {
        bg: 'var(--bg-primary)',
        cardBg: 'var(--bg-secondary)',
        border: 'var(--border-light)',
        textPrimary: 'var(--text-primary)',
        textSecondary: 'var(--text-secondary)',
        textMuted: 'var(--text-muted)',
        accent: 'var(--brand-blue)',
    };

    const priorityColors = {
        low: '#94a3b8',
        medium: '#f59e0b',
        high: '#ef4444',
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        // Get the current baseline value so progress starts from 0
        const courseId = (type === 'course_completion' || type === 'grade') && selectedCourse ? selectedCourse : undefined;
        const baselineValue = getCurrentAbsoluteValue(type, goalTypeConfig[type].defaultUnit, courseId);

        // Build metadata for course-specific goals and reminder setting
        const metadata: Record<string, any> = {
            notifications_enabled: reminder,
            baseline_value: baselineValue, // Store baseline so progress tracks from goal creation
        };
        if ((type === 'course_completion' || type === 'grade') && selectedCourse) {
            const course = COURSES_DATA[selectedCourse];
            metadata.course_id = selectedCourse;
            metadata.course_title = course?.title || selectedCourse;
        }

        onCreate({
            title: title.trim(),
            description: description.trim() || undefined,
            type,
            target_value: targetValue,
            current_value: 0,
            unit: goalTypeConfig[type].defaultUnit,
            priority,
            status: 'active' as GoalStatus,
            start_date: new Date().toISOString(),
            end_date: endDate ? new Date(endDate).toISOString() : undefined,
            metadata,
        });

        setTitle('');
        setDescription('');
        setType('study_time');
        setTargetValue(10);
        setPriority('medium');
        setEndDate('');
        setReminder(false);
        setSelectedCourse(null);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.4)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 9998,
                        }}
                    />
                    <div
                        ref={modalRef}
                        {...modalProps}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 9999,
                            pointerEvents: 'none',
                            padding: '20px',
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            style={{
                                width: '100%',
                                maxWidth: '440px',
                                maxHeight: '90vh',
                                background: 'var(--bg-primary)',
                                borderRadius: '20px',
                                boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
                                overflow: 'hidden',
                                pointerEvents: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                        <div style={{
                            padding: '20px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
                                    style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '10px',
                                        background: `${goalTypeConfig[type].color}15`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: goalTypeConfig[type].color,
                                    }}
                                >
                                    {GoalTypeIcons[type]}
                                </motion.div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        Set a New Goal
                                    </h2>
                                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>
                                        Track your learning progress
                                    </p>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1, background: 'var(--bg-hover)' }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </motion.button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                            {/* Goal Title with Icon */}
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '6px' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                    Goal Title
                                    <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="What do you want to achieve?"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: `1px solid var(--border-color)`,
                                        borderRadius: '10px',
                                        fontSize: '14px',
                                        outline: 'none',
                                        background: 'var(--bg-hover)',
                                        color: 'var(--text-primary)',
                                        boxSizing: 'border-box',
                                    }}
                                />
                            </div>

                            {/* Description */}
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '6px' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="16" y1="13" x2="8" y2="13" />
                                        <line x1="16" y1="17" x2="8" y2="17" />
                                    </svg>
                                    Description
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>(optional)</span>
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Why is this goal important to you?"
                                    rows={2}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: `1px solid var(--border-color)`,
                                        borderRadius: '10px',
                                        fontSize: '13px',
                                        outline: 'none',
                                        resize: 'none',
                                        background: 'var(--bg-hover)',
                                        color: 'var(--text-primary)',
                                        boxSizing: 'border-box',
                                        fontFamily: 'inherit',
                                    }}
                                />
                            </div>

                            {/* Goal Type Selection - Visual Cards */}
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '8px' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <circle cx="12" cy="12" r="6" />
                                        <circle cx="12" cy="12" r="2" />
                                    </svg>
                                    Goal Type
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                                    {(Object.entries(goalTypeConfig) as [GoalType, typeof goalTypeConfig[GoalType]][]).map(([key, config]) => (
                                        <motion.button
                                            key={key}
                                            type="button"
                                            onClick={() => setType(key)}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            style={{
                                                padding: '8px 4px',
                                                borderRadius: '8px',
                                                border: type === key ? `2px solid ${config.color}` : `1px solid var(--border-color)`,
                                                background: type === key ? `${config.color}10` : 'transparent',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '4px',
                                                color: type === key ? config.color : 'var(--text-secondary)',
                                            }}
                                        >
                                            {GoalTypeIcons[key]}
                                            <span style={{ fontSize: '9px', fontWeight: 500, textAlign: 'center', lineHeight: 1.2 }}>
                                                {config.label.split(' ')[0]}
                                            </span>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Course Selector - Shown for course_completion and grade types */}
                            <AnimatePresence mode="wait">
                            {(type === 'course_completion' || type === 'grade') && (
                                <motion.div
                                    key="course-selector"
                                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    animate={{ opacity: 1, height: 'auto', marginBottom: 14 }}
                                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                                    style={{ overflow: 'hidden' }}
                                >
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '8px' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                        </svg>
                                        Select Course
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>(optional - or track all)</span>
                                    </label>
                                    <div style={{ 
                                        display: 'grid', 
                                        gridTemplateColumns: 'repeat(3, 1fr)', 
                                        gap: '6px',
                                        maxHeight: '180px',
                                        overflowY: 'auto',
                                        padding: '2px',
                                    }}>
                                        {/* All Courses Option */}
                                        <motion.button
                                            type="button"
                                            onClick={() => {
                                                setSelectedCourse(null);
                                                // Set target based on goal type
                                                if (type === 'grade') {
                                                    setTargetValue(85); // Default overall grade target: 85%
                                                } else {
                                                    const totalModules = coursesList.reduce((sum, c) => sum + c.modules, 0);
                                                    setTargetValue(Math.min(5, totalModules)); // Default to 5 modules
                                                }
                                            }}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            style={{
                                                padding: '10px 8px',
                                                borderRadius: '10px',
                                                border: selectedCourse === null 
                                                    ? `2px solid ${type === 'grade' ? '#8b5cf6' : '#10b981'}` 
                                                    : `1px solid var(--border-color)`,
                                                background: selectedCourse === null 
                                                    ? (type === 'grade' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)') 
                                                    : 'transparent',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '4px',
                                                color: selectedCourse === null 
                                                    ? (type === 'grade' ? '#8b5cf6' : '#10b981') 
                                                    : 'var(--text-secondary)',
                                            }}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="3" width="7" height="7" />
                                                <rect x="14" y="3" width="7" height="7" />
                                                <rect x="14" y="14" width="7" height="7" />
                                                <rect x="3" y="14" width="7" height="7" />
                                            </svg>
                                            <span style={{ fontSize: '9px', fontWeight: 600, textAlign: 'center' }}>All Courses</span>
                                        </motion.button>
                                        {/* Individual Courses */}
                                        {coursesList.map((course) => (
                                            <motion.button
                                                key={course.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedCourse(course.id);
                                                    // Auto-set target based on goal type
                                                    if (type === 'grade') {
                                                        setTargetValue(90); // Default grade target: 90%
                                                    } else {
                                                        setTargetValue(course.modules); // Module count for course_completion
                                                    }
                                                }}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                style={{
                                                    padding: '10px 8px',
                                                    borderRadius: '10px',
                                                    border: selectedCourse === course.id 
                                                        ? `2px solid ${type === 'grade' ? '#8b5cf6' : '#10b981'}` 
                                                        : `1px solid var(--border-color)`,
                                                    background: selectedCourse === course.id 
                                                        ? (type === 'grade' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)') 
                                                        : 'transparent',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    color: selectedCourse === course.id 
                                                        ? (type === 'grade' ? '#8b5cf6' : '#10b981') 
                                                        : 'var(--text-secondary)',
                                                }}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                                </svg>
                                                <span style={{ fontSize: '9px', fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>
                                                    {course.shortTitle}
                                                </span>
                                            </motion.button>
                                        ))}
                                    </div>
                                    {selectedCourse && COURSES_DATA[selectedCourse] && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            style={{
                                                marginTop: '8px',
                                                padding: '10px 12px',
                                                borderRadius: '8px',
                                                background: type === 'grade' ? 'rgba(139, 92, 246, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                                                border: `1px solid ${type === 'grade' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <div>
                                                <p style={{ margin: 0, fontSize: '11px', color: type === 'grade' ? '#8b5cf6' : '#10b981', fontWeight: 500 }}>
                                                    {COURSES_DATA[selectedCourse].title}
                                                </p>
                                                <p style={{ margin: '2px 0 0', fontSize: '10px', color: 'var(--text-muted)' }}>
                                                    {COURSES_DATA[selectedCourse].instructor}
                                                </p>
                                            </div>
                                            <div style={{
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                background: type === 'grade' ? '#8b5cf6' : '#10b981',
                                                color: '#fff',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                            }}>
                                                {type === 'grade' 
                                                    ? `Target: ${targetValue}%` 
                                                    : `${COURSES_DATA[selectedCourse].modules} module${COURSES_DATA[selectedCourse].modules !== 1 ? 's' : ''}`
                                                }
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                            </AnimatePresence>

                            {/* Target Value */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '6px' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                        </svg>
                                        Target
                                    </label>
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '8px',
                                        padding: '6px 10px',
                                        border: `1px solid var(--border-color)`,
                                        borderRadius: '10px',
                                        background: 'var(--bg-hover)',
                                    }}>
                                        <motion.button
                                            type="button"
                                            onClick={() => setTargetValue(Math.max(1, targetValue - 1))}
                                            whileHover={{ scale: 1.1, backgroundColor: 'var(--bg-hover)' }}
                                            whileTap={{ scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            style={{
                                                width: '28px',
                                                height: '28px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: 'none',
                                                borderRadius: '6px',
                                                background: 'var(--bg-hover)',
                                                color: 'var(--text-primary)',
                                                cursor: 'pointer',
                                                fontSize: '16px',
                                                fontWeight: 500,
                                            }}
                                        >
                                            −
                                        </motion.button>
                                        <div style={{ 
                                            flex: 1, 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            gap: '6px',
                                            cursor: 'pointer',
                                        }}
                                        onDoubleClick={() => {
                                            setIsEditingTarget(true);
                                            setTempTargetValue(targetValue.toString());
                                        }}
                                        title="Double-click to edit"
                                        >
                                            {isEditingTarget ? (
                                                <motion.input
                                                    initial={{ scale: 0.9, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    type="text"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    maxLength={type === 'streak' ? 2 : 3}
                                                    value={tempTargetValue}
                                                    onChange={(e) => {
                                                        let val = e.target.value.replace(/[^0-9]/g, '');
                                                        // Limit to 2 digits for streak (max 31 days)
                                                        if (type === 'streak') {
                                                            val = val.slice(0, 2);
                                                            const num = parseInt(val) || 0;
                                                            if (num > 31) val = '31';
                                                        }
                                                        setTempTargetValue(val);
                                                    }}
                                                    onBlur={() => {
                                                        let val = parseInt(tempTargetValue) || 1;
                                                        // Cap streak at 31 days
                                                        if (type === 'streak') val = Math.min(31, val);
                                                        setTargetValue(Math.max(1, val));
                                                        setIsEditingTarget(false);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            let val = parseInt(tempTargetValue) || 1;
                                                            if (type === 'streak') val = Math.min(31, val);
                                                            setTargetValue(Math.max(1, val));
                                                            setIsEditingTarget(false);
                                                        }
                                                        if (e.key === 'Escape') {
                                                            setIsEditingTarget(false);
                                                        }
                                                    }}
                                                    autoFocus
                                                    style={{
                                                        width: type === 'streak' ? '36px' : '45px',
                                                        fontSize: '15px',
                                                        fontWeight: 600,
                                                        color: 'var(--text-primary)',
                                                        background: 'rgba(59, 130, 246, 0.08)',
                                                        border: `1.5px solid var(--accent-color)`,
                                                        borderRadius: '6px',
                                                        outline: 'none',
                                                        textAlign: 'center',
                                                        padding: '4px 6px',
                                                    }}
                                                />
                                            ) : (
                                                <motion.span
                                                    key={targetValue}
                                                    initial={{ opacity: 0, y: -8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.15 }}
                                                    style={{
                                                        fontSize: '15px',
                                                        fontWeight: 600,
                                                        color: 'var(--text-primary)',
                                                    }}
                                                >
                                                    {targetValue}
                                                </motion.span>
                                            )}
                                            <span style={{
                                                fontSize: '11px',
                                                color: 'var(--text-muted)',
                                                fontWeight: 500,
                                            }}>
                                                {goalTypeConfig[type].defaultUnit}
                                            </span>
                                        </div>
                                        <motion.button
                                            type="button"
                                            onClick={() => {
                                                const maxVal = type === 'streak' ? 31 : 999;
                                                setTargetValue(Math.min(maxVal, targetValue + 1));
                                            }}
                                            whileHover={{ scale: 1.1, backgroundColor: 'var(--bg-hover)' }}
                                            whileTap={{ scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            style={{
                                                width: '28px',
                                                height: '28px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: 'none',
                                                borderRadius: '6px',
                                                background: 'var(--bg-hover)',
                                                color: 'var(--text-primary)',
                                                cursor: 'pointer',
                                                fontSize: '16px',
                                                fontWeight: 500,
                                            }}
                                        >
                                            +
                                        </motion.button>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '6px' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                        Due Date
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>(optional)</span>
                                    </label>
                                    <div ref={dateInputRef} style={{ position: 'relative' }}>
                                        <motion.div 
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '6px 10px',
                                                border: `1px solid var(--border-color)`,
                                                borderRadius: '10px',
                                                background: 'var(--bg-hover)',
                                                height: '40px',
                                                boxSizing: 'border-box',
                                            }}
                                        >
                                            <motion.button
                                                type="button"
                                                onClick={() => {
                                                    if (endDate) {
                                                        const date = new Date(endDate);
                                                        date.setDate(date.getDate() - 1);
                                                        const today = new Date();
                                                        today.setHours(0, 0, 0, 0);
                                                        if (date >= today) {
                                                            setEndDate(date.toISOString().split('T')[0]);
                                                        }
                                                    }
                                                }}
                                                whileHover={{ scale: 1.1, backgroundColor: 'var(--bg-hover)' }}
                                                whileTap={{ scale: 0.95 }}
                                                transition={{ duration: 0.15 }}
                                                style={{
                                                    width: '28px',
                                                    height: '28px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    background: 'var(--bg-hover)',
                                                    color: 'var(--text-primary)',
                                                    cursor: endDate ? 'pointer' : 'not-allowed',
                                                    fontSize: '16px',
                                                    fontWeight: 500,
                                                    opacity: endDate ? 1 : 0.4,
                                                }}
                                            >
                                                −
                                            </motion.button>
                                            <div 
                                                style={{ 
                                                    flex: 1, 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                }}
                                                onDoubleClick={() => {
                                                    setShowCalendar(true);
                                                    if (endDate) {
                                                        const d = new Date(endDate);
                                                        setCalendarMonth(d.getMonth());
                                                        setCalendarYear(d.getFullYear());
                                                    } else {
                                                        setCalendarMonth(new Date().getMonth());
                                                        setCalendarYear(new Date().getFullYear());
                                                    }
                                                }}
                                                title="Double-click to open calendar"
                                            >
                                                <span style={{
                                                    fontSize: '13px',
                                                    fontWeight: 500,
                                                    color: endDate ? 'var(--text-primary)' : 'var(--text-muted)',
                                                }}>
                                                    {endDate ? new Date(endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Select'}
                                                </span>
                                            </div>
                                            <motion.button
                                                type="button"
                                                onClick={() => {
                                                    const currentYear = new Date().getFullYear();
                                                    const maxDate = new Date(currentYear + 1, 11, 31);
                                                    const date = endDate ? new Date(endDate) : new Date();
                                                    date.setDate(date.getDate() + 1);
                                                    if (date <= maxDate) {
                                                        setEndDate(date.toISOString().split('T')[0]);
                                                    }
                                                }}
                                                whileHover={{ scale: 1.1, backgroundColor: 'var(--bg-hover)' }}
                                                whileTap={{ scale: 0.95 }}
                                                transition={{ duration: 0.15 }}
                                                style={{
                                                    width: '28px',
                                                    height: '28px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    background: 'var(--bg-hover)',
                                                    color: 'var(--text-primary)',
                                                    cursor: 'pointer',
                                                    fontSize: '16px',
                                                    fontWeight: 500,
                                                }}
                                            >
                                                +
                                            </motion.button>
                                        </motion.div>
                                        
                                        {/* Custom Calendar Picker - Rendered via Portal outside modal */}
                                        {showCalendar && createPortal(
                                            <AnimatePresence>
                                                <motion.div
                                                    ref={calendarRef}
                                                    initial={{ opacity: 0, x: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                                    exit={{ opacity: 0, x: -10, scale: 0.95 }}
                                                    transition={{ duration: 0.2 }}
                                                    style={{
                                                        position: 'fixed',
                                                        top: calendarPosition.top,
                                                        left: calendarPosition.left,
                                                        width: '260px',
                                                        background: 'var(--bg-secondary)',
                                                        border: `1px solid var(--border-color)`,
                                                        borderRadius: '12px',
                                                        padding: '12px',
                                                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                                        zIndex: 10000,
                                                    }}
                                                >
                                                    {/* Month/Year Header */}
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                        <motion.button
                                                            type="button"
                                                            onClick={() => {
                                                                const currentYear = new Date().getFullYear();
                                                                if (calendarMonth === 0) {
                                                                    if (calendarYear > currentYear) {
                                                                        setCalendarMonth(11);
                                                                        setCalendarYear(calendarYear - 1);
                                                                    }
                                                                } else {
                                                                    setCalendarMonth(calendarMonth - 1);
                                                                }
                                                            }}
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            style={{
                                                                width: '24px',
                                                                height: '24px',
                                                                border: 'none',
                                                                borderRadius: '6px',
                                                                background: 'transparent',
                                                                color: 'var(--text-secondary)',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="15 18 9 12 15 6" />
                                                            </svg>
                                                        </motion.button>
                                                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                            {new Date(calendarYear, calendarMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                                        </span>
                                                        <motion.button
                                                            type="button"
                                                            onClick={() => {
                                                                const currentYear = new Date().getFullYear();
                                                                if (calendarMonth === 11) {
                                                                    if (calendarYear < currentYear + 1) {
                                                                        setCalendarMonth(0);
                                                                        setCalendarYear(calendarYear + 1);
                                                                    }
                                                                } else {
                                                                    setCalendarMonth(calendarMonth + 1);
                                                                }
                                                            }}
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            style={{
                                                                width: '24px',
                                                                height: '24px',
                                                                border: 'none',
                                                                borderRadius: '6px',
                                                                background: 'transparent',
                                                                color: 'var(--text-secondary)',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="9 18 15 12 9 6" />
                                                            </svg>
                                                        </motion.button>
                                                    </div>
                                                    
                                                    {/* Day Headers */}
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
                                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                                            <div key={i} style={{ textAlign: 'center', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', padding: '4px' }}>
                                                                {day}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    
                                                    {/* Calendar Days */}
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                                                        {(() => {
                                                            const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
                                                            const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                                                            const today = new Date();
                                                            today.setHours(0, 0, 0, 0);
                                                            const currentYear = today.getFullYear();
                                                            const days = [];
                                                            
                                                            // Empty cells for days before first of month
                                                            for (let i = 0; i < firstDay; i++) {
                                                                days.push(<div key={`empty-${i}`} />);
                                                            }
                                                            
                                                            // Days of the month
                                                            for (let day = 1; day <= daysInMonth; day++) {
                                                                const date = new Date(calendarYear, calendarMonth, day);
                                                                const dateStr = date.toISOString().split('T')[0];
                                                                const isSelected = endDate === dateStr;
                                                                const isPast = date < today;
                                                                const isFuture = date > new Date(currentYear + 1, 11, 31);
                                                                const isDisabled = isPast || isFuture;
                                                                const isToday = date.toDateString() === today.toDateString();
                                                                
                                                                days.push(
                                                                    <motion.button
                                                                        key={day}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            if (!isDisabled) {
                                                                                setEndDate(dateStr);
                                                                                setShowCalendar(false);
                                                                            }
                                                                        }}
                                                                        whileHover={!isDisabled ? { scale: 1.1 } : {}}
                                                                        whileTap={!isDisabled ? { scale: 0.95 } : {}}
                                                                        style={{
                                                                            width: '28px',
                                                                            height: '28px',
                                                                            border: isToday ? '1.5px solid #3b82f6' : 'none',
                                                                            borderRadius: '6px',
                                                                            background: isSelected ? '#3b82f6' : 'transparent',
                                                                            color: isSelected ? '#fff' : isDisabled ? 'var(--text-muted)' : 'var(--text-primary)',
                                                                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                                            fontSize: '12px',
                                                                            fontWeight: isSelected || isToday ? 600 : 400,
                                                                            opacity: isDisabled ? 0.4 : 1,
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                        }}
                                                                    >
                                                                        {day}
                                                                    </motion.button>
                                                                );
                                                            }
                                                            
                                                            return days;
                                                        })()}
                                                    </div>
                                                    
                                                    {/* Clear/Close buttons */}
                                                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', paddingTop: '10px', borderTop: `1px solid var(--border-color)` }}>
                                                        <motion.button
                                                            type="button"
                                                            onClick={() => {
                                                                setEndDate('');
                                                                setShowCalendar(false);
                                                            }}
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            style={{
                                                                flex: 1,
                                                                padding: '6px',
                                                                border: `1px solid var(--border-color)`,
                                                                borderRadius: '6px',
                                                                background: 'transparent',
                                                                color: 'var(--text-secondary)',
                                                                fontSize: '11px',
                                                                fontWeight: 500,
                                                                cursor: 'pointer',
                                                            }}
                                                        >
                                                            Clear
                                                        </motion.button>
                                                        <motion.button
                                                            type="button"
                                                            onClick={() => setShowCalendar(false)}
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            style={{
                                                                flex: 1,
                                                                padding: '6px',
                                                                border: 'none',
                                                                borderRadius: '6px',
                                                                background: '#3b82f6',
                                                                color: '#fff',
                                                                fontSize: '11px',
                                                                fontWeight: 500,
                                                                cursor: 'pointer',
                                                            }}
                                                        >
                                                            Done
                                                        </motion.button>
                                                    </div>
                                                </motion.div>
                                            </AnimatePresence>,
                                            document.body
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Priority Selection - Visual Buttons */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '8px' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                                        <line x1="4" y1="22" x2="4" y2="15" />
                                    </svg>
                                    Priority Level
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                    {(['low', 'medium', 'high'] as GoalPriority[]).map((p) => (
                                        <motion.button
                                            key={p}
                                            type="button"
                                            onClick={() => setPriority(p)}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            style={{
                                                padding: '10px 8px',
                                                borderRadius: '10px',
                                                border: priority === p ? `2px solid ${priorityColors[p]}` : `1px solid var(--border-color)`,
                                                background: priority === p ? `${priorityColors[p]}10` : 'transparent',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px',
                                                color: priority === p ? priorityColors[p] : 'var(--text-secondary)',
                                            }}
                                        >
                                            <span style={{ color: priorityColors[p] }}>{PriorityIcons[p]}</span>
                                            <span style={{ fontSize: '12px', fontWeight: 500, textTransform: 'capitalize' }}>{p}</span>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Reminder Toggle */}
                            <div style={{ 
                                marginBottom: '18px', 
                                padding: '12px', 
                                borderRadius: '10px', 
                                background: 'var(--dashboard-surface)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ 
                                        width: '32px', 
                                        height: '32px', 
                                        borderRadius: '8px', 
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#3b82f6',
                                    }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>Daily Reminders</div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Get notified about your progress</div>
                                    </div>
                                </div>
                                <label 
                                    className="settings-switch" 
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ flexShrink: 0 }}
                                >
                                    <input 
                                        type="checkbox" 
                                        checked={reminder} 
                                        onChange={() => setReminder(!reminder)}
                                    />
                                    <div className="settings-slider">
                                        <div className="settings-circle">
                                            <svg className="settings-cross" viewBox="0 0 365.696 365.696" xmlns="http://www.w3.org/2000/svg">
                                                <path fill="currentColor" d="M243.188 182.86 356.32 69.726c12.5-12.5 12.5-32.766 0-45.247L341.238 9.398c-12.504-12.503-32.77-12.503-45.25 0L182.86 122.528 69.727 9.374c-12.5-12.5-32.766-12.5-45.247 0L9.375 24.457c-12.5 12.504-12.5 32.77 0 45.25l113.152 113.152L9.398 295.99c-12.503 12.503-12.503 32.769 0 45.25L24.48 356.32c12.5 12.5 32.766 12.5 45.247 0l113.132-113.132L295.99 356.32c12.503 12.5 32.769 12.5 45.25 0l15.081-15.082c12.5-12.504 12.5-32.77 0-45.25zm0 0" />
                                            </svg>
                                            <svg className="settings-checkmark" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="M4 12l5 5L20 6" />
                                            </svg>
                                        </div>
                                    </div>
                                </label>
                            </div>

                            {/* Tip Section */}
                            <div style={{ 
                                marginBottom: '16px', 
                                padding: '10px 12px', 
                                borderRadius: '8px', 
                                background: 'rgba(16, 185, 129, 0.08)',
                                border: '1px solid rgba(16, 185, 129, 0.15)',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '8px',
                            }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ marginTop: '1px', flexShrink: 0 }}>
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                                <p style={{ margin: 0, fontSize: '11px', color: '#10b981', lineHeight: 1.4 }}>
                                    <strong>Tip:</strong> Start with achievable goals. Small wins build momentum for bigger achievements!
                                </p>
                            </div>

                            {/* Submit Button */}
                            <motion.button
                                type="submit"
                                whileHover={{ scale: 1.01, boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)' }}
                                whileTap={{ scale: 0.99 }}
                                disabled={!title.trim()}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: title.trim() ? `linear-gradient(135deg, ${goalTypeConfig[type].color}, ${goalTypeConfig[type].color}dd)` : 'var(--border-color)',
                                    color: title.trim() ? '#fff' : 'var(--text-muted)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    cursor: title.trim() ? 'pointer' : 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                                Create Goal
                            </motion.button>
                        </form>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};


export { CreateGoalModal };
export default CreateGoalModal;
