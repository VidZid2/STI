'use client';

import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getStreakData, getStreakTier, updateStreak, type StreakData } from '../../../services/studyTimeService';

interface StreakDropdownProps {
    className?: string;
}

const StreakDropdown: React.FC<StreakDropdownProps> = ({ className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [streakData, setStreakData] = useState<StreakData>(() => getStreakData());
    const [showWelcome, setShowWelcome] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showAutoTooltip, setShowAutoTooltip] = useState(false);
    const [tutorialsCompleted, setTutorialsCompleted] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Check if tutorials are completed (welcome modal + dashboard tutorial)
    useEffect(() => {
        const checkTutorials = () => {
            const welcomeCompleted = localStorage.getItem('welcome-modal-completed') === 'true';
            const tutorialCompleted = localStorage.getItem('tutorial-completed') === 'true';
            setTutorialsCompleted(welcomeCompleted && tutorialCompleted);
        };
        
        checkTutorials();
        
        // Listen for storage changes (in case tutorial completes while component is mounted)
        const handleStorageChange = () => checkTutorials();
        window.addEventListener('storage', handleStorageChange);
        
        // Also poll periodically in case localStorage changes in same tab
        const pollInterval = setInterval(checkTutorials, 1000);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(pollInterval);
        };
    }, []);

    // Check for dark mode
    useEffect(() => {
        const checkDarkMode = () => {
            setIsDarkMode(document.body.classList.contains('dark-mode'));
        };
        checkDarkMode();
        
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        
        return () => observer.disconnect();
    }, []);

    // Update streak on mount and check if first visit today
    useEffect(() => {
        const data = getStreakData();
        const today = new Date().toISOString().split('T')[0];
        const wasFirstVisitToday = data.lastActiveDate !== today;
        
        updateStreak();
        const updatedData = getStreakData();
        setStreakData(updatedData);
        
        // Only show welcome animation if tutorials are completed and first visit today
        if (wasFirstVisitToday && tutorialsCompleted) {
            setShowWelcome(true);
            setIsOpen(true);
            setTimeout(() => setShowWelcome(false), 3000);
        }
    }, [tutorialsCompleted]);

    // Show auto tooltip only after tutorials are completed
    useEffect(() => {
        if (!tutorialsCompleted) return;
        
        // Show auto tooltip after a short delay
        const tooltipTimer = setTimeout(() => {
            setShowAutoTooltip(true);
            // Auto-hide after 4 seconds
            setTimeout(() => setShowAutoTooltip(false), 4000);
        }, 1500);
        
        return () => clearTimeout(tooltipTimer);
    }, [tutorialsCompleted]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const tier = getStreakTier(streakData.currentStreak);

    // Generate calendar days for current week + some context
    const generateCalendarDays = useCallback(() => {
        const today = new Date();
        const days: { date: Date; isActive: boolean; isToday: boolean; dayName: string }[] = [];
        
        // Get last 7 days including today
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const isActive = streakData.streakHistory.some(h => h.date === dateStr && h.active);
            const isToday = i === 0;
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            days.push({ date, isActive, isToday, dayName });
        }
        
        return days;
    }, [streakData.streakHistory]);

    const calendarDays = generateCalendarDays();

    // Get motivational message
    const getMessage = () => {
        if (streakData.currentStreak >= 30) return "Legendary! You're unstoppable! 🏆";
        if (streakData.currentStreak >= 14) return "Two weeks strong! Amazing dedication! 💪";
        if (streakData.currentStreak >= 7) return "One week streak! Keep it going! 🔥";
        if (streakData.currentStreak >= 3) return "Great momentum! Don't break the chain!";
        if (streakData.currentStreak === 2) return "Day 2! You're building a habit!";
        return "Welcome back! Start your streak today!";
    };

    // Dark mode aware colors
    const getDarkModeColors = () => {
        if (isDarkMode) {
            return {
                buttonHover: 'rgba(255, 255, 255, 0.1)',
                dropdownBg: '#1e293b',
                dropdownBorder: 'rgba(71, 85, 105, 0.5)',
                headerBorder: 'rgba(71, 85, 105, 0.5)',
                textPrimary: '#f1f5f9',
                textSecondary: '#94a3b8',
                textMuted: '#64748b',
                statsBg: 'rgba(51, 65, 85, 0.5)',
                tipBg: 'linear-gradient(to right, rgba(30, 58, 138, 0.3), rgba(67, 56, 202, 0.3))',
                tipBorder: 'rgba(59, 130, 246, 0.3)',
                tipText: '#93c5fd',
                calendarInactive: 'rgba(51, 65, 85, 0.8)',
                calendarInactiveText: '#64748b',
                ringOffset: '#1e293b',
            };
        }
        return {
            buttonHover: 'rgba(244, 244, 245, 1)',
            dropdownBg: '#ffffff',
            dropdownBorder: 'rgba(228, 228, 231, 0.8)',
            headerBorder: 'rgba(244, 244, 245, 1)',
            textPrimary: '#18181b',
            textSecondary: '#71717a',
            textMuted: '#a1a1aa',
            statsBg: 'rgba(244, 244, 245, 1)',
            tipBg: 'linear-gradient(to right, rgba(239, 246, 255, 1), rgba(238, 242, 255, 1))',
            tipBorder: 'rgba(191, 219, 254, 0.5)',
            tipText: '#1d4ed8',
            calendarInactive: 'rgba(244, 244, 245, 1)',
            calendarInactiveText: '#a1a1aa',
            ringOffset: '#ffffff',
        };
    };

    const colors = getDarkModeColors();

    // Button background colors
    const getButtonBg = () => {
        if (isOpen) {
            return isDarkMode 
                ? 'rgba(59, 130, 246, 0.25)' 
                : 'rgba(59, 130, 246, 0.12)';
        }
        return isDarkMode 
            ? 'rgba(59, 130, 246, 0.15)' 
            : 'rgba(59, 130, 246, 0.08)';
    };

    const getButtonHoverBg = () => {
        return isDarkMode 
            ? 'rgba(59, 130, 246, 0.3)' 
            : 'rgba(59, 130, 246, 0.15)';
    };

    // Get streak label text - with milestone celebrations
    const getStreakLabel = () => {
        if (streakData.currentStreak === 0) return "Start your streak!";
        if (streakData.currentStreak === 1) return "Day 1 streak!";
        if (streakData.currentStreak === 5) return "5 days! Halfway! 🎯";
        if (streakData.currentStreak < 7) return `${streakData.currentStreak} day streak!`;
        if (streakData.currentStreak === 7) return "1 week! 🔥";
        if (streakData.currentStreak === 10) return "10 days! 🌟";
        if (streakData.currentStreak < 14) return "On fire! 🔥";
        if (streakData.currentStreak < 30) return "Unstoppable!";
        return "Legendary! 🏆";
    };

    // Get tooltip message - special messages for milestones
    const getTooltipMessage = () => {
        if (streakData.currentStreak === 0) return "Start your daily streak today!";
        if (streakData.currentStreak === 1) return "Great start! Come back tomorrow";
        if (streakData.currentStreak === 5) return "Halfway to weekly bonus! 🎯";
        if (streakData.currentStreak < 7) return `${7 - streakData.currentStreak} days to weekly bonus!`;
        if (streakData.currentStreak === 7) return "Weekly bonus unlocked! 🎉";
        if (streakData.currentStreak === 10) return "10 day milestone! Amazing! 🌟";
        if (streakData.currentStreak < 14) return `${14 - streakData.currentStreak} days to 2-week bonus!`;
        return "Keep the momentum going!";
    };

    return (
        <div className={`relative ${className || ''}`}>
            {/* Auto-playing tooltip - only show after tutorials are completed */}
            <AnimatePresence>
                {showAutoTooltip && !isOpen && tutorialsCompleted && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.95 }}
                        transition={{ 
                            type: 'spring', 
                            stiffness: 400, 
                            damping: 25 
                        }}
                        className="absolute right-0 top-full mt-2 z-50"
                    >
                        <div 
                            className="relative px-3 py-2 rounded-lg shadow-lg"
                            style={{
                                backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                                border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                                boxShadow: isDarkMode 
                                    ? '0 8px 24px -8px rgba(0, 0, 0, 0.4)'
                                    : '0 8px 24px -8px rgba(59, 130, 246, 0.2)',
                            }}
                        >
                            {/* Arrow */}
                            <div 
                                className="absolute -top-1.5 right-4 w-3 h-3 rotate-45"
                                style={{
                                    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                                    borderLeft: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                                    borderTop: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                                }}
                            />
                            
                            <div className="flex items-center gap-2">
                                <motion.span 
                                    className="text-base"
                                    animate={{ 
                                        scale: [1, 1.15, 1],
                                        rotate: [0, -5, 5, 0]
                                    }}
                                    transition={{ 
                                        duration: 1.5, 
                                        repeat: Infinity,
                                        repeatDelay: 1
                                    }}
                                >
                                    {tier.flameEmoji}
                                </motion.span>
                                <div className="flex flex-col">
                                    <span 
                                        className="text-[11px] font-semibold"
                                        style={{ color: isDarkMode ? '#f1f5f9' : '#18181b' }}
                                    >
                                        {getTooltipMessage()}
                                    </span>
                                    <span 
                                        className="text-[9px]"
                                        style={{ color: isDarkMode ? '#94a3b8' : '#71717a' }}
                                    >
                                        Click to view your progress
                                    </span>
                                </div>
                            </div>
                            
                            {/* Progress bar animation */}
                            <motion.div 
                                className="absolute bottom-0 left-0 h-0.5 rounded-b-lg"
                                style={{ 
                                    backgroundColor: isDarkMode ? '#3b82f6' : '#3b82f6',
                                    opacity: 0.6
                                }}
                                initial={{ width: '100%' }}
                                animate={{ width: '0%' }}
                                transition={{ duration: 4, ease: 'linear' }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Streak Button - Enhanced minimalistic design */}
            <motion.button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex items-center gap-2 px-3 py-2 rounded-xl overflow-hidden"
                style={{
                    background: getButtonBg(),
                    border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = getButtonHoverBg();
                    e.currentTarget.style.borderColor = isDarkMode ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.3)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = getButtonBg();
                    e.currentTarget.style.borderColor = isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)';
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
                {/* Subtle gradient overlay */}
                <motion.div
                    className="absolute inset-0 opacity-30"
                    style={{
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 197, 253, 0.05) 100%)',
                    }}
                    animate={{
                        opacity: isOpen ? 0.5 : 0.3,
                    }}
                    transition={{ duration: 0.2 }}
                />

                {/* Droplet/Flame Icon with enhanced animation - only animate after tutorials */}
                <motion.div
                    className="relative z-10 flex items-center justify-center"
                    animate={tutorialsCompleted && streakData.currentStreak >= 3 ? { 
                        y: [0, -2, 0],
                    } : {}}
                    transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        ease: 'easeInOut'
                    }}
                >
                    <motion.span
                        className="text-lg drop-shadow-sm"
                        animate={tutorialsCompleted && streakData.currentStreak >= 7 ? {
                            scale: [1, 1.1, 1],
                            rotate: [0, -3, 3, 0],
                        } : {}}
                        transition={{ 
                            duration: 3, 
                            repeat: Infinity, 
                            ease: 'easeInOut'
                        }}
                    >
                        {tier.flameEmoji}
                    </motion.span>
                    
                    {/* Glow effect behind icon for high streaks - only animate after tutorials */}
                    {tutorialsCompleted && streakData.currentStreak >= 7 && (
                        <motion.div
                            className="absolute inset-0 rounded-full blur-md -z-10"
                            style={{
                                background: tier.tier === 'legendary' 
                                    ? 'rgba(251, 191, 36, 0.4)' 
                                    : tier.tier === 'warming'
                                    ? 'rgba(249, 115, 22, 0.3)'
                                    : 'rgba(59, 130, 246, 0.3)',
                            }}
                            animate={{
                                scale: [1, 1.3, 1],
                                opacity: [0.4, 0.7, 0.4],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        />
                    )}
                </motion.div>
                
                {/* Streak Count with enhanced styling */}
                <div className="relative z-10 flex flex-col items-start min-w-0">
                    <div className="flex items-baseline gap-1">
                        <motion.span 
                            className="text-sm font-bold leading-none"
                            style={{ 
                                color: isDarkMode ? '#93c5fd' : '#3b82f6',
                                textShadow: isDarkMode ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                            }}
                            key={streakData.currentStreak}
                            initial={{ scale: 1.2, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        >
                            {streakData.currentStreak}
                        </motion.span>
                        <span 
                            className="text-[9px] font-medium uppercase tracking-wider opacity-70"
                            style={{ color: isDarkMode ? '#93c5fd' : '#3b82f6' }}
                        >
                            {streakData.currentStreak === 1 ? 'day' : 'days'}
                        </span>
                    </div>
                </div>

                {/* Right side: Progress dots + Streak label below */}
                <div className="relative z-10 flex flex-col items-center gap-1 ml-1">
                    {/* Mini progress indicator - show for streaks 1-10 */}
                    {streakData.currentStreak > 0 && streakData.currentStreak <= 10 && (
                        <div className="flex gap-0.5">
                            {[...Array(Math.min(streakData.currentStreak <= 7 ? 7 : 10, 10))].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{
                                        backgroundColor: i < streakData.currentStreak 
                                            ? (isDarkMode ? '#93c5fd' : '#3b82f6')
                                            : (isDarkMode ? 'rgba(148, 163, 184, 0.3)' : 'rgba(59, 130, 246, 0.2)'),
                                    }}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: i * 0.05, type: 'spring', stiffness: 300 }}
                                />
                            ))}
                        </div>
                    )}
                    
                    {/* Streak label text - below dots, bigger */}
                    <motion.span 
                        className="text-[10px] font-semibold whitespace-nowrap"
                        style={{ 
                            color: isDarkMode ? 'rgba(147, 197, 253, 0.85)' : 'rgba(59, 130, 246, 0.85)',
                        }}
                        initial={{ opacity: 0, y: -3 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.3 }}
                    >
                        {getStreakLabel()}
                    </motion.span>
                </div>

                {/* XP badge for high streaks */}
                {streakData.currentStreak >= 7 && (
                    <motion.div
                        className="relative z-10 px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wide"
                        style={{
                            background: isDarkMode 
                                ? 'rgba(59, 130, 246, 0.3)' 
                                : 'rgba(59, 130, 246, 0.15)',
                            color: isDarkMode ? '#93c5fd' : '#3b82f6',
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                    >
                        +{tier.xpBonus}xp
                    </motion.div>
                )}

                {/* Pulse indicator for active streak - only animate after tutorials */}
                {tutorialsCompleted && streakData.currentStreak >= 3 && (
                    <motion.div
                        className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                        style={{ 
                            backgroundColor: tier.tier === 'legendary' 
                                ? '#fbbf24' 
                                : tier.tier === 'warming' 
                                ? '#f97316' 
                                : '#3b82f6' 
                        }}
                        animate={{ 
                            scale: [1, 1.5, 1], 
                            opacity: [1, 0.5, 1] 
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                )}

                {/* Shimmer effect on hover */}
                <motion.div
                    className="absolute inset-0 -z-0"
                    style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                        transform: 'translateX(-100%)',
                    }}
                    whileHover={{
                        transform: 'translateX(100%)',
                        transition: { duration: 0.6, ease: 'easeInOut' }
                    }}
                />
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={dropdownRef}
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ 
                            type: 'spring', 
                            stiffness: 400, 
                            damping: 25 
                        }}
                        className="absolute right-0 top-full mt-2 w-72 rounded-xl shadow-lg overflow-hidden z-50"
                        style={{
                            backgroundColor: colors.dropdownBg,
                            border: `1px solid ${colors.dropdownBorder}`,
                            boxShadow: isDarkMode 
                                ? '0 10px 40px -10px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)'
                                : '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                        }}
                    >
                        {/* Header with streak info */}
                        <div 
                            className="p-4"
                            style={{ 
                                background: tier.bgGradient,
                                borderBottom: `1px solid ${colors.headerBorder}`
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <motion.div
                                    className="text-3xl"
                                    animate={showWelcome ? {
                                        scale: [1, 1.3, 1],
                                        rotate: [0, -10, 10, -10, 0]
                                    } : {}}
                                    transition={{ duration: 0.6 }}
                                >
                                    {tier.flameEmoji}
                                </motion.div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <motion.span
                                            className="text-2xl font-bold"
                                            style={{ color: isDarkMode ? '#f1f5f9' : tier.textColor }}
                                            initial={showWelcome ? { scale: 0 } : { scale: 1 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', delay: 0.2 }}
                                        >
                                            {streakData.currentStreak}
                                        </motion.span>
                                        <span 
                                            className="text-sm font-medium"
                                            style={{ color: isDarkMode ? '#cbd5e1' : tier.textColor }}
                                        >
                                            day streak
                                        </span>
                                    </div>
                                    <p 
                                        className="text-xs mt-0.5"
                                        style={{ color: isDarkMode ? '#94a3b8' : tier.subTextColor }}
                                    >
                                        {getMessage()}
                                    </p>
                                </div>
                                {/* XP Badge */}
                                <motion.div
                                    className="px-2 py-1 rounded-full text-[10px] font-semibold"
                                    style={{
                                        backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.3)' : `${tier.borderColor}40`,
                                        color: isDarkMode ? '#93c5fd' : tier.textColor
                                    }}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', delay: 0.3 }}
                                >
                                    +{tier.xpBonus} XP
                                </motion.div>
                            </div>
                        </div>

                        {/* Calendar Week View */}
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <span 
                                    className="text-xs font-medium uppercase tracking-wide"
                                    style={{ color: colors.textSecondary }}
                                >
                                    This Week
                                </span>
                                <span 
                                    className="text-[10px]"
                                    style={{ color: colors.textMuted }}
                                >
                                    Best: {streakData.bestStreak} days
                                </span>
                            </div>
                            
                            <div className="flex justify-between gap-1">
                                {calendarDays.map((day, index) => (
                                    <motion.div
                                        key={day.date.toISOString()}
                                        className="flex flex-col items-center gap-1"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <span 
                                            className="text-[10px] font-medium"
                                            style={{ 
                                                color: day.isToday 
                                                    ? '#3b82f6' 
                                                    : colors.textMuted 
                                            }}
                                        >
                                            {day.dayName}
                                        </span>
                                        <motion.div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all"
                                            style={{
                                                backgroundColor: day.isActive 
                                                    ? isDarkMode
                                                        ? tier.tier === 'legendary' 
                                                            ? 'rgba(251, 191, 36, 0.3)'
                                                            : tier.tier === 'warming'
                                                            ? 'rgba(249, 115, 22, 0.25)'
                                                            : 'rgba(59, 130, 246, 0.25)'
                                                        : tier.tier === 'legendary' 
                                                            ? 'rgba(251, 191, 36, 0.2)'
                                                            : tier.tier === 'warming'
                                                            ? 'rgba(249, 115, 22, 0.15)'
                                                            : 'rgba(59, 130, 246, 0.15)'
                                                    : colors.calendarInactive,
                                                color: day.isActive 
                                                    ? isDarkMode ? '#f1f5f9' : tier.textColor 
                                                    : colors.calendarInactiveText,
                                                boxShadow: day.isToday 
                                                    ? `0 0 0 2px #3b82f6, 0 0 0 4px ${colors.ringOffset}` 
                                                    : 'none'
                                            }}
                                            whileHover={{ scale: 1.1 }}
                                        >
                                            {day.isActive ? (
                                                <motion.span
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: 'spring', delay: index * 0.05 + 0.2 }}
                                                >
                                                    {day.isToday ? '🔥' : '✓'}
                                                </motion.span>
                                            ) : (
                                                <span>
                                                    {day.date.getDate()}
                                                </span>
                                            )}
                                        </motion.div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Stats Footer */}
                        <div className="px-4 pb-4">
                            <div className="flex gap-2">
                                <div 
                                    className="flex-1 p-2.5 rounded-lg"
                                    style={{ backgroundColor: colors.statsBg }}
                                >
                                    <div 
                                        className="text-[10px] uppercase tracking-wide"
                                        style={{ color: colors.textMuted }}
                                    >
                                        Current
                                    </div>
                                    <div 
                                        className="text-sm font-semibold mt-0.5"
                                        style={{ color: colors.textPrimary }}
                                    >
                                        {streakData.currentStreak} days
                                    </div>
                                </div>
                                <div 
                                    className="flex-1 p-2.5 rounded-lg"
                                    style={{ backgroundColor: colors.statsBg }}
                                >
                                    <div 
                                        className="text-[10px] uppercase tracking-wide"
                                        style={{ color: colors.textMuted }}
                                    >
                                        Best
                                    </div>
                                    <div 
                                        className="text-sm font-semibold mt-0.5"
                                        style={{ color: colors.textPrimary }}
                                    >
                                        {streakData.bestStreak} days
                                    </div>
                                </div>
                                <div 
                                    className="flex-1 p-2.5 rounded-lg"
                                    style={{ backgroundColor: colors.statsBg }}
                                >
                                    <div 
                                        className="text-[10px] uppercase tracking-wide"
                                        style={{ color: colors.textMuted }}
                                    >
                                        Total XP
                                    </div>
                                    <div 
                                        className="text-sm font-semibold mt-0.5"
                                        style={{ color: colors.textPrimary }}
                                    >
                                        {streakData.currentStreak * tier.xpBonus}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Motivational tip */}
                        <div className="px-4 pb-4">
                            <div 
                                className="p-3 rounded-lg"
                                style={{ 
                                    background: colors.tipBg,
                                    border: `1px solid ${colors.tipBorder}`
                                }}
                            >
                                <div className="flex items-start gap-2">
                                    <span className="text-sm">💡</span>
                                    <p 
                                        className="text-[11px] leading-relaxed"
                                        style={{ color: colors.tipText }}
                                    >
                                        {streakData.currentStreak < 7 
                                            ? "Log in daily to build your streak and earn bonus XP!"
                                            : streakData.currentStreak < 14
                                            ? "You're doing great! Keep the momentum going!"
                                            : "You're a streak master! Inspire others with your dedication!"
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StreakDropdown;
