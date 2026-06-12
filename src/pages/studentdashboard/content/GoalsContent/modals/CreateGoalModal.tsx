/**
 * CreateGoalModal
 * Multi-step goal creation wizard.
 * Extracted from GoalsContent.tsx during Phase 8.3
 */
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
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
import { UiverseSwitch } from '../../../../../components/ui/UiverseSwitch';

type NewGoalData = Omit<Goal, 'id' | 'student_id' | 'created_at' | 'updated_at'>;

const CreateGoalModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onCreate: (goal: NewGoalData) => void;
}> = ({ isOpen, onClose, onCreate }) => {
    const isDarkMode = document.documentElement.classList.contains('dark');
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
    const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0, width: 0 });
    const calendarRef = React.useRef<HTMLDivElement>(null);
    const dateInputRef = React.useRef<HTMLDivElement>(null);
    
    const [isMinimized, setIsMinimized] = useState(false);
    const lastScrollY = React.useRef(0);
    const scrollDirection = React.useRef<'up' | 'down' | null>(null);
    const anchorScrollY = React.useRef(0);

    const handleScroll = React.useCallback((e: React.UIEvent<HTMLFormElement>) => {
        const currentScrollY = e.currentTarget.scrollTop;
        
        if (currentScrollY <= 10) {
            setIsMinimized(false);
            lastScrollY.current = currentScrollY;
            scrollDirection.current = null;
            anchorScrollY.current = currentScrollY;
            return;
        }

        const delta = currentScrollY - lastScrollY.current;
        
        if (delta > 0) {
            if (scrollDirection.current !== 'down') {
                scrollDirection.current = 'down';
                anchorScrollY.current = lastScrollY.current;
            }
            if (currentScrollY - anchorScrollY.current > 30) {
                setIsMinimized(true);
            }
        } else if (delta < 0) {
            if (scrollDirection.current !== 'up') {
                scrollDirection.current = 'up';
                anchorScrollY.current = lastScrollY.current;
            }
        }

        lastScrollY.current = currentScrollY;
    }, []);

    // Click outside handler for calendar
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node) &&
                dateInputRef.current && !dateInputRef.current.contains(event.target as Node)) {
                setShowCalendar(false);
            }
        };

        const handleScroll = () => {
            setShowCalendar(false);
        };
        
        if (showCalendar) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScroll, true);
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [showCalendar]);
    
    // Update calendar position when showing
    useEffect(() => {
        if (showCalendar && dateInputRef.current) {
            const rect = dateInputRef.current.getBoundingClientRect();
            setCalendarPosition({
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width,
            });
        }
    }, [showCalendar]);
    
    // Get courses list
    const coursesList = Object.values(COURSES_DATA);

    // Custom dropdown states
    const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);
    const [hoveredCourseId, setHoveredCourseId] = useState<string | null>(null);
    const courseDropdownRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (courseDropdownRef.current && !courseDropdownRef.current.contains(event.target as Node)) {
                setIsCourseDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, []);

    const colors = {
        bg: isDarkMode ? '#0f172a' : '#ffffff',
        cardBg: isDarkMode ? '#1e293b' : '#f8fafc',
        border: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        textPrimary: isDarkMode ? '#f1f5f9' : '#0f172a',
        textSecondary: isDarkMode ? '#94a3b8' : '#64748b',
        textMuted: isDarkMode ? '#64748b' : '#94a3b8',
        accent: '#3b82f6',
    };

    const priorityColors = {
        low: '#3b82f6',
        medium: '#f59e0b',
        high: '#ef4444',
    };

    const getPriorityClasses = (p: string, isActive: boolean) => {
        if (!isActive) return 'bg-white dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800';
        switch (p) {
            case 'low': return 'bg-blue-50/50 dark:bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm';
            case 'medium': return 'bg-amber-50/50 dark:bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 shadow-sm';
            case 'high': return 'bg-red-50/50 dark:bg-red-500/10 border-red-500 text-red-600 dark:text-red-400 shadow-sm';
            default: return '';
        }
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

    return createPortal(
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
                            transition={{ 
                                type: 'spring', 
                                damping: 28, 
                                stiffness: 350,
                                layout: { type: 'spring', damping: 25, stiffness: 200 }
                            }}
                            className="bg-white dark:bg-[#0f172a] shadow-2xl relative flex flex-col overflow-hidden pointer-events-auto"
                            style={{
                                width: '100%',
                                maxWidth: '640px',
                                height: '85vh',
                                maxHeight: '800px',
                                borderRadius: '20px',
                                boxShadow: isDarkMode 
                                    ? '0 25px 80px rgba(0, 0, 0, 0.6)' 
                                    : '0 25px 80px rgba(0, 0, 0, 0.2)',
                            }}
                        >
                        {/* Header */}
                        <motion.div 
                            animate={{
                                padding: isMinimized ? '12px 16px' : '24px 24px 8px 24px'
                            }}
                            className="relative border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-t-[20px]"
                        >
                            <motion.div 
                                animate={{ marginBottom: isMinimized ? '0px' : '20px' }}
                                className="flex items-start gap-3 sm:gap-4"
                            >
                                {/* Student Tools Style Header Card */}
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ 
                                        opacity: 1, 
                                        y: 0,
                                        padding: isMinimized ? '12px 16px' : '14px 16px',
                                        gap: isMinimized ? '12px' : '14px'
                                    }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.1 }}
                                    className="flex-1 relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[20px] sm:rounded-[24px] flex items-center group transition-all duration-300 hover:shadow-md hover:border-blue-200/80 dark:hover:border-blue-800/50 text-left"
                                >
                                    {/* SaaS Background Accents */}
                                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
                                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />

                                    <motion.div
                                        animate={{
                                            width: isMinimized ? 40 : 46,
                                            height: isMinimized ? 40 : 46,
                                            borderRadius: isMinimized ? 12 : 14
                                        }}
                                        whileHover={{ scale: 1.05, rotate: -5 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                        className="bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center flex-shrink-0 shadow-sm text-blue-600 dark:text-blue-400 relative z-10"
                                        style={{
                                            background: `${goalTypeConfig[type].color}15`,
                                            borderColor: `${goalTypeConfig[type].color}30`,
                                            color: goalTypeConfig[type].color,
                                        }}
                                    >
                                        <div className="scale-105 sm:scale-110 flex items-center justify-center">
                                            {GoalTypeIcons[type]}
                                        </div>
                                    </motion.div>
                                    
                                    <div className="relative z-10 flex-1 min-w-0 pr-10 sm:pr-12">
                                        <motion.h2 
                                            animate={{ fontSize: isMinimized ? '16px' : '18px' }}
                                            className="font-bold text-zinc-900 dark:text-zinc-100 tracking-tight m-0 mb-0.5 truncate"
                                        >
                                            Set a New Goal
                                        </motion.h2>
                                        <motion.p 
                                            animate={{ fontSize: '12px' }}
                                            className="text-zinc-600 dark:text-zinc-400 leading-snug m-0 truncate"
                                        >
                                            Track your learning progress
                                        </motion.p>
                                    </div>
                                    <div className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 z-20">
                                        <motion.button
                                            type="button"
                                            onClick={onClose}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="flex-shrink-0 flex items-center justify-center rounded-lg border border-zinc-200/80 bg-white/80 backdrop-blur-md p-1.5 text-zinc-500 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700/80 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-700"
                                            aria-label="Close modal"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </motion.button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </motion.div>

                        <form onScroll={handleScroll} onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 sm:py-6 space-y-6 custom-scrollbar">
                            {/* Goal Title with Icon */}
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-2.5 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                                    <div className="w-6 h-6 rounded-[8px] bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 shadow-sm">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    </div>
                                    Goal Title
                                    <span className="text-red-500 ml-0.5">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="What do you want to achieve?"
                                    required
                                    className="w-full px-4 py-3 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-2.5 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                                    <div className="w-6 h-6 rounded-[8px] bg-slate-50 dark:bg-slate-500/10 flex items-center justify-center text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-500/20 shadow-sm">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                            <line x1="16" y1="13" x2="8" y2="13" />
                                            <line x1="16" y1="17" x2="8" y2="17" />
                                        </svg>
                                    </div>
                                    Description
                                    <span className="text-[11px] text-zinc-400 font-medium ml-1">(optional)</span>
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Why is this goal important to you?"
                                    rows={2}
                                    className="w-full px-4 py-3 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm resize-none custom-scrollbar"
                                />
                            </div>

                            {/* Goal Type Selection - Visual Cards */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2.5 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                                    <div className="w-6 h-6 rounded-[8px] bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-500/20 shadow-sm">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <circle cx="12" cy="12" r="10" />
                                            <circle cx="12" cy="12" r="6" />
                                            <circle cx="12" cy="12" r="2" />
                                        </svg>
                                    </div>
                                    Goal Type
                                </label>
                                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                                    {(Object.entries(goalTypeConfig) as [GoalType, typeof goalTypeConfig[GoalType]][]).map(([key, config]) => (
                                        <motion.button
                                            key={key}
                                            type="button"
                                            onClick={() => setType(key)}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`relative flex flex-col items-center justify-center p-3 rounded-xl sm:rounded-2xl border transition-all duration-200 cursor-pointer ${
                                                type === key 
                                                ? 'shadow-sm ring-1 ring-black/5 dark:ring-white/5' 
                                                : 'border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/30 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400'
                                            }`}
                                            style={type === key ? {
                                                borderColor: config.color,
                                                backgroundColor: `${config.color}10`,
                                                color: config.color,
                                                boxShadow: `0 0 0 1px ${config.color}20`
                                            } : undefined}
                                        >
                                            <div className="mb-1.5 scale-110">
                                                {GoalTypeIcons[key]}
                                            </div>
                                            <span className="text-[10px] sm:text-xs font-medium tracking-wide">
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
                                    className="relative space-y-2"
                                    style={{ zIndex: isCourseDropdownOpen ? 50 : 1 }}
                                >
                                    <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                        </svg>
                                        Select Course
                                        <span className="text-[10px] text-zinc-400 font-normal">(optional - or track all)</span>
                                    </label>
                                    <div className="relative group mt-1" ref={courseDropdownRef}>
                                        <button
                                            type="button"
                                            onClick={() => setIsCourseDropdownOpen(!isCourseDropdownOpen)}
                                            className={`w-full relative flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 border rounded-xl py-2.5 pl-3 pr-4 transition-all duration-200 focus:outline-none focus:ring-2 ${
                                                isCourseDropdownOpen 
                                                    ? (type === 'grade' ? 'border-violet-500/50 ring-violet-500/20 bg-white dark:bg-zinc-800' : 'border-emerald-500/50 ring-emerald-500/20 bg-white dark:bg-zinc-800')
                                                    : 'border-zinc-200 dark:border-zinc-700/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                {selectedCourse && COURSES_DATA[selectedCourse] ? (
                                                    <div className="w-6 h-6 rounded-md overflow-hidden shrink-0 shadow-sm border border-black/5 dark:border-white/10">
                                                        <img 
                                                            src={COURSES_DATA[selectedCourse].image} 
                                                            alt={COURSES_DATA[selectedCourse].shortTitle} 
                                                            className="w-full h-full object-cover" 
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className={`w-6 h-6 rounded-md overflow-hidden shrink-0 shadow-sm flex items-center justify-center border ${
                                                        type === 'grade' ? 'bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 border-violet-500/10' : 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/10'
                                                    }`}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <polygon points="12 2 2 7 12 12 22 7 12 2" />
                                                            <polyline points="2 12 12 17 22 12" />
                                                            <polyline points="2 17 12 22 22 17" />
                                                        </svg>
                                                    </div>
                                                )}
                                                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 truncate">
                                                    {selectedCourse 
                                                        ? COURSES_DATA[selectedCourse].title
                                                        : "All Courses (Track All)"
                                                    }
                                                </span>
                                            </div>
                                            <motion.div
                                                animate={{ rotate: isCourseDropdownOpen ? 180 : 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="text-zinc-400 shrink-0 ml-2"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="6 9 12 15 18 9" />
                                                </svg>
                                            </motion.div>
                                        </button>

                                        <AnimatePresence>
                                            {isCourseDropdownOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -5, height: 0 }}
                                                    animate={{
                                                        opacity: 1,
                                                        y: 0,
                                                        height: "auto",
                                                        transition: {
                                                            type: "spring",
                                                            stiffness: 500,
                                                            damping: 30,
                                                            mass: 1,
                                                        },
                                                    }}
                                                    exit={{
                                                        opacity: 0,
                                                        y: -5,
                                                        height: 0,
                                                        transition: {
                                                            type: "spring",
                                                            stiffness: 500,
                                                            damping: 30,
                                                            mass: 1,
                                                        },
                                                    }}
                                                    className="absolute left-0 right-0 top-full mt-2 z-50 overflow-hidden"
                                                >
                                                    <div className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-1.5 shadow-xl max-h-[260px] overflow-y-auto custom-scrollbar">
                                                        <div className="relative flex flex-col gap-0.5">
                                                            {/* "All Courses" Option */}
                                                            {(() => {
                                                                const isSelected = selectedCourse === null;
                                                                const isActive = (hoveredCourseId || (selectedCourse === null ? 'all' : selectedCourse)) === 'all';
                                                                
                                                                return (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setSelectedCourse(null);
                                                                            setIsCourseDropdownOpen(false);
                                                                            if (type === 'grade') setTargetValue(85);
                                                                            else {
                                                                                const totalModules = coursesList.reduce((sum, c) => sum + c.modules, 0);
                                                                                setTargetValue(Math.min(5, totalModules));
                                                                            }
                                                                        }}
                                                                        onMouseEnter={() => setHoveredCourseId('all')}
                                                                        onMouseLeave={() => setHoveredCourseId(null)}
                                                                        className={`relative flex w-full items-center px-3 py-2 text-xs rounded-lg transition-colors focus:outline-none ${
                                                                            isSelected 
                                                                                ? 'text-blue-700 dark:text-blue-400 font-medium' 
                                                                                : isActive 
                                                                                    ? 'text-zinc-900 dark:text-zinc-100 font-medium' 
                                                                                    : 'text-zinc-600 dark:text-zinc-400'
                                                                        }`}
                                                                    >
                                                                        {isActive && (
                                                                            <motion.div
                                                                                layoutId="course-dropdown-highlight"
                                                                                className={`absolute inset-0 rounded-lg z-0 ${isSelected ? 'bg-blue-50 dark:bg-blue-500/10' : 'bg-zinc-100 dark:bg-zinc-800'}`}
                                                                                initial={false}
                                                                                transition={{
                                                                                    type: "spring",
                                                                                    bounce: 0.2,
                                                                                    duration: 0.5,
                                                                                }}
                                                                            />
                                                                        )}
                                                                        <motion.div 
                                                                            className={`relative z-10 w-7 h-7 rounded-md overflow-hidden shrink-0 shadow-sm mr-3 flex items-center justify-center border ${
                                                                                type === 'grade' ? 'bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 border-violet-500/10' : 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/10'
                                                                            }`}
                                                                            animate={{ scale: isActive ? 1.05 : 1 }}
                                                                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                                                        >
                                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                                                                                <polyline points="2 12 12 17 22 12" />
                                                                                <polyline points="2 17 12 22 22 17" />
                                                                            </svg>
                                                                        </motion.div>
                                                                        <span className="relative z-10 font-semibold text-[13px]">All Courses (Track All)</span>
                                                                    </button>
                                                                );
                                                            })()}
                                                            
                                                            <div className="my-1 border-t border-zinc-100 dark:border-zinc-800 mx-2" />
                                                            
                                                            {coursesList.map((course) => {
                                                                const isSelected = selectedCourse === course.id;
                                                                const isActive = (hoveredCourseId || (selectedCourse === null ? 'all' : selectedCourse)) === course.id;
                                                                return (
                                                                    <button
                                                                        key={course.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setSelectedCourse(course.id);
                                                                            setIsCourseDropdownOpen(false);
                                                                            if (type === 'grade') setTargetValue(90);
                                                                            else setTargetValue(course.modules);
                                                                        }}
                                                                        onMouseEnter={() => setHoveredCourseId(course.id)}
                                                                        onMouseLeave={() => setHoveredCourseId(null)}
                                                                        className={`relative flex w-full items-center px-3 py-2 text-xs rounded-lg transition-colors focus:outline-none ${
                                                                            isSelected 
                                                                                ? 'text-blue-700 dark:text-blue-400 font-medium' 
                                                                                : isActive 
                                                                                    ? 'text-zinc-900 dark:text-zinc-100 font-medium' 
                                                                                    : 'text-zinc-600 dark:text-zinc-400'
                                                                        }`}
                                                                    >
                                                                        {isActive && (
                                                                            <motion.div
                                                                                layoutId="course-dropdown-highlight"
                                                                                className={`absolute inset-0 rounded-lg z-0 ${isSelected ? 'bg-blue-50 dark:bg-blue-500/10' : 'bg-zinc-100 dark:bg-zinc-800'}`}
                                                                                initial={false}
                                                                                transition={{
                                                                                    type: "spring",
                                                                                    bounce: 0.2,
                                                                                    duration: 0.5,
                                                                                }}
                                                                            />
                                                                        )}
                                                                        <motion.div 
                                                                            className="relative z-10 w-7 h-7 rounded-md overflow-hidden shrink-0 shadow-sm mr-3 border border-black/5 dark:border-white/10"
                                                                            animate={{ scale: isActive ? 1.05 : 1 }}
                                                                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                                                        >
                                                                            <img 
                                                                                src={course.image} 
                                                                                alt={course.shortTitle} 
                                                                                className="w-full h-full object-cover" 
                                                                            />
                                                                        </motion.div>
                                                                        <span className="relative z-10 truncate flex-1 text-left font-semibold text-[13px]">{course.title}</span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    {selectedCourse && COURSES_DATA[selectedCourse] && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-3 p-3 rounded-[16px] border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800/90 shadow-sm flex flex-col gap-3"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 ${
                                                    type === 'grade' ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                }`}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0 pt-0.5">
                                                    <h4 className="m-0 text-[13px] font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                                        {COURSES_DATA[selectedCourse].title}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                                            {COURSES_DATA[selectedCourse].instructor}
                                                        </span>
                                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                                            type === 'grade' ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                        }`}>
                                                            {selectedCourse.toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-700/50 pt-3">
                                                <div className="group inline-flex items-center gap-2 bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 rounded-[12px] p-1 pr-3 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default">
                                                    <div className={`w-6 h-6 rounded-[8px] flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${
                                                        type === 'grade' ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                    }`}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <polyline points="12 6 12 12 16 14" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 tracking-wide uppercase">
                                                        Current Target
                                                    </span>
                                                </div>
                                                <div className={`px-3 py-1.5 rounded-[12px] text-[11px] font-bold shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 ${
                                                    type === 'grade' ? 'text-violet-600 dark:text-violet-400' : 'text-emerald-600 dark:text-emerald-400'
                                                }`}>
                                                    {type === 'grade' 
                                                        ? `${targetValue}% Overall Grade` 
                                                        : `${targetValue} Module${targetValue !== 1 ? 's' : ''}`
                                                    }
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                            </AnimatePresence>

                            {/* Target Value & Due Date */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-2.5 text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-2">
                                        <div className="w-6 h-6 rounded-[8px] bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                            </svg>
                                        </div>
                                        Target
                                    </label>
                                    <div className="flex items-center gap-2 p-1.5 bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm h-10 box-border">
                                        <motion.button
                                            type="button"
                                            onClick={() => setTargetValue(Math.max(1, targetValue - 1))}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="shrink-0 w-7 h-7 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 shadow-sm hover:shadow-md transition-all text-base font-medium"
                                        >
                                            −
                                        </motion.button>
                                        <div 
                                            className="flex-1 flex items-center justify-center gap-1.5 cursor-pointer"
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
                                                        if (type === 'streak') {
                                                            val = val.slice(0, 2);
                                                            const num = parseInt(val) || 0;
                                                            if (num > 31) val = '31';
                                                        }
                                                        setTempTargetValue(val);
                                                    }}
                                                    onBlur={() => {
                                                        let val = parseInt(tempTargetValue) || 1;
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
                                                    className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 border-2 border-blue-500 rounded-lg outline-none text-center px-1.5 py-0.5 shadow-sm"
                                                    style={{ width: type === 'streak' ? '36px' : '45px' }}
                                                />
                                            ) : (
                                                <motion.span
                                                    key={targetValue}
                                                    initial={{ opacity: 0, y: -8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100"
                                                >
                                                    {targetValue}
                                                </motion.span>
                                            )}
                                            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                                                {goalTypeConfig[type].defaultUnit}
                                            </span>
                                        </div>
                                        <motion.button
                                            type="button"
                                            onClick={() => {
                                                const maxVal = type === 'streak' ? 31 : 999;
                                                setTargetValue(Math.min(maxVal, targetValue + 1));
                                            }}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="shrink-0 w-7 h-7 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 shadow-sm hover:shadow-md transition-all text-base font-medium"
                                        >
                                            +
                                        </motion.button>
                                    </div>
                                </div>
                                <div>
                                    <label className="flex items-center gap-2.5 text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-2">
                                        <div className="w-6 h-6 rounded-[8px] bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20 shadow-sm">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                <line x1="3" y1="10" x2="21" y2="10" />
                                            </svg>
                                        </div>
                                        Due Date
                                        <span className="text-[11px] text-zinc-400 font-medium ml-1">(optional)</span>
                                    </label>
                                    <div ref={dateInputRef} className="relative">
                                        <motion.div 
                                            className="flex items-center gap-2 p-1.5 bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm h-10 box-border"
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
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className={`shrink-0 w-7 h-7 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 shadow-sm transition-all text-base font-medium ${endDate ? 'bg-white dark:bg-zinc-800 hover:shadow-md cursor-pointer' : 'bg-white/50 dark:bg-zinc-800/50 opacity-40 cursor-not-allowed'}`}
                                            >
                                                −
                                            </motion.button>
                                            <div 
                                                className="flex-1 flex items-center justify-center cursor-pointer"
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
                                                    color: endDate ? colors.textPrimary : colors.textMuted,
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
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="shrink-0 w-7 h-7 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 shadow-sm transition-all hover:shadow-md cursor-pointer text-base font-medium"
                                            >
                                                +
                                            </motion.button>
                                        </motion.div>
                                        
                                        {/* Custom Calendar Picker - Rendered via Portal outside modal */}
                                        {createPortal(
                                            <AnimatePresence>
                                                {showCalendar && (
                                                    <motion.div
                                                        ref={calendarRef}
                                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                                    style={{
                                                        position: 'fixed',
                                                        top: `${calendarPosition.top}px`,
                                                        left: `${calendarPosition.left}px`,
                                                        width: `${calendarPosition.width}px`,
                                                        zIndex: 10000,
                                                    }}
                                                    className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4"
                                                >
                                                    {/* Month/Year Header */}
                                                    <div className="flex items-center justify-between mb-3">
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
                                                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="15 18 9 12 15 6" />
                                                            </svg>
                                                        </motion.button>
                                                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
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
                                                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="9 18 15 12 9 6" />
                                                            </svg>
                                                        </motion.button>
                                                    </div>
                                                    
                                                    {/* Day Headers */}
                                                    <div className="grid grid-cols-7 gap-1 mb-2">
                                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                                            <div key={i} className="text-center text-[10px] font-bold text-zinc-400 dark:text-zinc-500 p-1">
                                                                {day}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    
                                                    {/* Calendar Days */}
                                                    <div className="grid grid-cols-7 gap-1">
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
                                                                        className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-medium transition-all ${
                                                                            isSelected 
                                                                            ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30' 
                                                                            : isDisabled 
                                                                                ? 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed opacity-50' 
                                                                                : isToday 
                                                                                    ? 'border border-blue-500 text-blue-600 dark:text-blue-400 font-semibold' 
                                                                                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer'
                                                                        }`}
                                                                    >
                                                                        {day}
                                                                    </motion.button>
                                                                );
                                                            }
                                                            
                                                            return days;
                                                        })()}
                                                    </div>
                                                    
                                                    {/* Clear/Close buttons */}
                                                    <div className="flex gap-2 mt-4 pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80">
                                                        <motion.button
                                                            type="button"
                                                            onClick={() => {
                                                                setEndDate('');
                                                                setShowCalendar(false);
                                                            }}
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            className="flex-1 py-1.5 px-3 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-400 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                                        >
                                                            Clear
                                                        </motion.button>
                                                        <motion.button
                                                            type="button"
                                                            onClick={() => setShowCalendar(false)}
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            className="flex-1 py-1.5 px-3 bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm shadow-blue-500/30 hover:bg-blue-600 transition-colors"
                                                        >
                                                            Done
                                                        </motion.button>
                                                    </div>
                                                </motion.div>
                                                )}
                                            </AnimatePresence>,
                                            document.body
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Priority Selection - Visual Buttons */}
                            <div className="mb-4">
                                <label className="flex items-center gap-2.5 text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-3">
                                    <div className="w-6 h-6 rounded-[8px] bg-pink-50 dark:bg-pink-500/10 flex items-center justify-center text-pink-600 dark:text-pink-400 border border-pink-100 dark:border-pink-500/20 shadow-sm">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                                            <line x1="4" y1="22" x2="4" y2="15" />
                                        </svg>
                                    </div>
                                    Priority Level
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['low', 'medium', 'high'] as GoalPriority[]).map((p) => (
                                        <motion.button
                                            key={p}
                                            type="button"
                                            onClick={() => setPriority(p)}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-semibold capitalize transition-all ${getPriorityClasses(p, priority === p)}`}
                                        >
                                            <span style={{ color: priorityColors[p] }}>{PriorityIcons[p]}</span>
                                            <span>{p}</span>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Reminder Toggle */}
                            <div 
                                className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 shadow-sm rounded-[16px] sm:rounded-[20px] p-3 sm:p-4 flex items-center justify-between gap-3 sm:gap-5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer mb-4"
                                onClick={() => setReminder(!reminder)}
                            >
                                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                    <motion.div
                                        whileHover={{ scale: 1.05, rotate: -5 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                        className="w-11 h-11 sm:w-14 sm:h-14 rounded-[12px] sm:rounded-[16px] bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center shrink-0 shadow-sm relative transition-transform duration-300"
                                    >
                                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                        </svg>
                                    </motion.div>
                                    <div className="flex-1 min-w-0 pr-2">
                                        <h2 className="text-[15px] sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug sm:leading-none mb-0.5 sm:mb-1.5 transition-colors truncate">
                                            Daily Reminders
                                        </h2>
                                        <p className="text-[12px] sm:text-sm font-medium text-zinc-500 dark:text-zinc-400 leading-snug">
                                            Get notified about your progress
                                        </p>
                                    </div>
                                </div>
                                <div className="scale-[0.8] sm:scale-[0.85] origin-right shrink-0" onClick={(e) => e.stopPropagation()}>
                                    <UiverseSwitch checked={reminder} onChange={(checked) => setReminder(checked)} />
                                </div>
                            </div>

                            {/* Tip Section */}
                            <div className="flex items-center gap-3 px-4 py-3.5 mb-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 shadow-sm">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-emerald-600 dark:text-emerald-400 shrink-0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                                <p className="m-0 text-[13px] font-medium text-emerald-700 dark:text-emerald-400 leading-tight">
                                    <strong className="font-bold text-emerald-800 dark:text-emerald-300">Tip:</strong> Start with achievable goals. Small wins build momentum for bigger achievements!
                                </p>
                            </div>

                            {/* Submit Button */}
                            <motion.button
                                type="submit"
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                disabled={!title.trim()}
                                className={`w-full flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-[14px] transition-colors focus:outline-none ${
                                    title.trim() 
                                        ? 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300 shadow-sm cursor-pointer' 
                                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                                }`}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
        </AnimatePresence>,
        document.body
    );
};


export { CreateGoalModal };
export default CreateGoalModal;
