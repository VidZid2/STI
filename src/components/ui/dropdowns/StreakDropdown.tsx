'use client';

import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getStreakData, getStreakTier, type StreakData } from '../../../services/studyTimeService';
import { DailyStreakModal } from '../../modals/DailyStreakModal';

// Session storage key to track if modal was shown this session
const STREAK_MODAL_SHOWN_KEY = 'streak-modal-shown-session';

interface StreakDropdownProps {
    className?: string;
}

const StreakDropdown: React.FC<StreakDropdownProps> = ({ className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [streakData, setStreakData] = useState<StreakData>(() => getStreakData());
    const [showWelcome, setShowWelcome] = useState(false);
    const [showStreakModal, setShowStreakModal] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showAutoTooltip, setShowAutoTooltip] = useState(false);
    const [tutorialsCompleted, setTutorialsCompleted] = useState(false);
    const [componentReady, setComponentReady] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
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

    // Mark component as ready after a short delay to ensure DOM is stable
    useEffect(() => {
        const timer = setTimeout(() => {
            setComponentReady(true);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    // Show streak modal on first visit of the day
    // Shows immediately if tutorials are completed, or after a delay if not
    useEffect(() => {
        if (!componentReady) return;
        
        // Check if modal was already shown this session
        const modalShownThisSession = sessionStorage.getItem(STREAK_MODAL_SHOWN_KEY) === 'true';
        if (modalShownThisSession) return;
        
        // If tutorials are completed, show immediately
        // If not, wait a bit longer to avoid conflicting with other modals
        const delay = tutorialsCompleted ? 300 : 2000;
        
        const timer = setTimeout(() => {
            // Double-check session storage in case it was set during the delay
            if (sessionStorage.getItem(STREAK_MODAL_SHOWN_KEY) === 'true') return;
            
            // Get current streak data
            const data = getStreakData();
            setStreakData(data);
            
            // Show modal and mark as shown for this session
            sessionStorage.setItem(STREAK_MODAL_SHOWN_KEY, 'true');
            setShowWelcome(true);
            setShowStreakModal(true);
            setTimeout(() => setShowWelcome(false), 3000);
        }, delay);
        
        return () => clearTimeout(timer);
    }, [componentReady, tutorialsCompleted]);

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

    // Get motivational message — tier-specific daily rotation + 1/100 Easter egg
    const getMessage = useCallback(() => {
        // 🥉 Bronze (1-9 days) — Starter, encouraging, building habits
        const BRONZE = [
            "Every journey starts with a single step!",
            "Day by day, you're building a habit!",
            "Small steps lead to big results.",
            "The expert was once a beginner.",
            "You showed up — that's what matters!",
            "Welcome back! Let's make today count.",
            "Consistency starts right here, right now.",
            "One day at a time. You got this!",
            "Great things never come from comfort zones.",
            "Your brain is a muscle — train it daily.",
            "Progress, not perfection.",
            "Future you will thank present you.",
            "Loading... your best self.",
            "First steps are the hardest — you're doing it!",
            "Keep going — your future diploma agrees.",
        ];

        // 🥈 Silver (10-29 days) — Momentum, discipline, growing confidence
        const SILVER = [
            "Double digits! You're on fire!",
            "Consistency beats talent. Always.",
            "The grind doesn't lie — keep pushing.",
            "You didn't come this far to only come this far.",
            "Discipline is the bridge between goals and results.",
            "Your streak is proof you're serious.",
            "The compound effect is real. Keep stacking.",
            "Each login is a rep for your mind.",
            "You're becoming unstoppable.",
            "Respect the process. Trust the grind.",
            "Be so good they can't ignore you.",
            "Today's effort = tomorrow's advantage.",
            "You + Consistency = Dangerous combo.",
            "Not everyone shows up — but you do.",
            "Your consistency is your superpower.",
        ];

        // 🥇 Gold (30-89 days) — Elite, champion, unstoppable
        const GOLD = [
            "30+ days?! You're in the elite now!",
            "Champions are made in the daily grind.",
            "Legends don't take days off!",
            "You're writing your success story right now.",
            "Winners train, losers complain.",
            "You're in the top tier of dedication.",
            "Look how far you've come!",
            "Your dedication is inspiring others!",
            "Plot twist: you're the main character.",
            "Error 404: excuses not found.",
            "Brain gains > gym gains (jk do both).",
            "Gold tier unlocked. Now aim for Diamond!",
            "This streak is a flex. Keep flexing.",
            "You're living proof hard work pays off.",
            "Your streak is looking *chef's kiss*!",
        ];

        // 💎 Diamond (90+ days) — Legendary, mythical, transcendent
        const DIAMOND = [
            "90+ DAYS. You're a living legend!",
            "Diamond-tier dedication. Absolutely elite.",
            "They'll write stories about this streak.",
            "You've transcended normal. You're built different.",
            "This is what mastery looks like.",
            "Your willpower is made of diamonds.",
            "The world bends to the disciplined mind.",
            "90 days of pure, unstoppable focus.",
            "There's no ceiling for someone like you.",
            "Diamond hands? No — Diamond mind.",
            "Your streak could outlast some careers.",
            "At this point, the streak owns YOU. (jk)",
            "Legendary status: confirmed.",
            "Consistency is your middle name now.",
            "If dedication had a face, it'd be yours.",
        ];

        const EASTER_EGG = "Kaya mo yan boss, kunting tae lang :D";

        // Seed random from date so it changes daily
        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        
        // Simple hash for pseudo-random
        const hash = ((seed * 2654435761) >>> 0) % 10000;

        // 1 in 100 chance for easter egg
        if (hash % 100 === 42) {
            // Unlock the achievement!
            try {
                const key = 'achievement-unlocks';
                const saved = JSON.parse(localStorage.getItem(key) || '{}');
                if (!saved['easter-egg-tae']) {
                    saved['easter-egg-tae'] = new Date().toISOString();
                    localStorage.setItem(key, JSON.stringify(saved));
                }
            } catch { /* silent */ }
            return EASTER_EGG;
        }

        // Pick tier-specific pool based on current streak
        const s = streakData.currentStreak;
        const pool = s >= 90 ? DIAMOND : s >= 30 ? GOLD : s >= 10 ? SILVER : BRONZE;

        const index = hash % pool.length;
        return pool[index];
    }, [streakData.currentStreak]);

    // Get tooltip message
    const getTooltipMessage = () => {
        if (streakData.currentStreak === 0) return "Start your streak today";
        if (streakData.currentStreak === 1) return "Day 1 · Come back tomorrow";
        if (streakData.currentStreak < 7) return `${7 - streakData.currentStreak}d to weekly milestone`;
        if (streakData.currentStreak === 7) return "Weekly milestone reached";
        if (streakData.currentStreak < 10) return `${10 - streakData.currentStreak}d to Silver tier`;
        if (streakData.currentStreak === 10) return "Silver tier unlocked";
        if (streakData.currentStreak < 30) return `${30 - streakData.currentStreak}d to Gold tier`;
        if (streakData.currentStreak < 90) return `${90 - streakData.currentStreak}d to Diamond`;
        return "Diamond tier · Legendary";
    };

    // Compact progress bar (0-1 ratio toward next milestone)
    const getProgress = () => {
        const s = streakData.currentStreak;
        if (s < 7) return s / 7;
        if (s < 14) return (s - 7) / 7;
        if (s < 30) return (s - 14) / 16;
        return 1;
    };

    const getNextMilestone = () => {
        const s = streakData.currentStreak;
        if (s < 7) return 7;
        if (s < 14) return 14;
        if (s < 30) return 30;
        return 30;
    };

    return (
        <div className={`relative ${className || ''}`}>
            {/* Daily Streak Modal - shows on first visit of the day */}
            <DailyStreakModal
                isOpen={showStreakModal}
                onClose={() => setShowStreakModal(false)}
                streakData={streakData}
            />

            {/* Auto-playing & hover tooltip - beautiful premium SaaS design */}
            <AnimatePresence>
                {((showAutoTooltip && tutorialsCompleted) || isHovered) && !isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: 4, x: "-50%" }}
                        transition={{ type: 'spring', stiffness: 450, damping: 26 }}
                        className="absolute top-full mt-2.5 z-50"
                        style={{ left: '50%', width: '250px' }}
                    >
                        <div
                            className="p-3 rounded-xl flex items-center gap-3 backdrop-blur-md"
                            style={{
                                backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                                border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.12)'}`,
                                boxShadow: isDarkMode 
                                    ? '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 16px -6px rgba(0, 0, 0, 0.5)'
                                    : '0 10px 25px -5px rgba(59, 130, 246, 0.08), 0 8px 16px -6px rgba(59, 130, 246, 0.04)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {/* SVG Animated Fire Icon */}
                            <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg"
                                 style={{
                                     background: isDarkMode ? 'rgba(251, 146, 60, 0.12)' : 'rgba(251, 146, 60, 0.06)',
                                     border: `1px solid ${isDarkMode ? 'rgba(251, 146, 60, 0.2)' : 'rgba(251, 146, 60, 0.1)'}`,
                                 }}
                            >
                                <motion.svg 
                                    width="18" 
                                    height="18" 
                                    viewBox="0 0 24 24" 
                                    fill="none"
                                    animate={{ 
                                        scale: [1, 1.04, 0.97, 1.03, 1],
                                        y: [0, -0.8, 0.4, -0.4, 0],
                                        rotate: [0, 2, -2, 1, 0]
                                    }}
                                    transition={{ 
                                        repeat: Infinity, 
                                        duration: 1.8, 
                                        ease: "easeInOut" 
                                    }}
                                >
                                    {/* Outer Flame (Orange-Red gradient) */}
                                    <motion.path 
                                        d="M12 2C10 6 7 9 7 13.5a5 5 0 0 0 10 0C17 9 14 6 12 2z" 
                                        fill="url(#outerFlameGrad)" 
                                        animate={{
                                            scaleX: [1, 1.05, 0.95, 1.03, 1],
                                            scaleY: [1, 0.96, 1.04, 0.97, 1],
                                        }}
                                        transition={{
                                            repeat: Infinity,
                                            duration: 1.2,
                                            ease: "easeInOut"
                                        }}
                                        style={{ transformOrigin: "center bottom" }}
                                    />
                                    {/* Inner Flame (Yellow-Orange gradient) */}
                                    <motion.path 
                                        d="M12 7c-1 2.5-2.5 4-2.5 6.5a2.5 2.5 0 0 0 5 0c0-2.5-1.5-4-2.5-6.5z" 
                                        fill="url(#innerFlameGrad)" 
                                        animate={{
                                            scaleX: [1, 0.9, 1.1, 0.95, 1],
                                            scaleY: [1, 1.1, 0.9, 1.05, 1],
                                        }}
                                        transition={{
                                            repeat: Infinity,
                                            duration: 0.9,
                                            ease: "easeInOut"
                                        }}
                                        style={{ transformOrigin: "center bottom" }}
                                    />
                                    <defs>
                                        <linearGradient id="outerFlameGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="#ff7a00" />
                                            <stop offset="100%" stopColor="#ef4444" />
                                        </linearGradient>
                                        <linearGradient id="innerFlameGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="#facc15" />
                                            <stop offset="100%" stopColor="#ff7a00" />
                                        </linearGradient>
                                    </defs>
                                </motion.svg>
                            </div>

                            {/* Text content */}
                            <div className="flex-1 min-w-0 flex flex-col gap-0.5" style={{ textAlign: 'left' }}>
                                <span 
                                    className="text-[9px] font-bold uppercase tracking-wider leading-none"
                                    style={{ color: '#3b82f6' }}
                                >
                                    Daily Streak
                                </span>
                                <span
                                    className="text-[12px] font-medium leading-normal"
                                    style={{ color: isDarkMode ? '#e2e8f0' : '#334155' }}
                                >
                                    {getTooltipMessage()}
                                </span>
                            </div>

                            {/* Arrow Pointer */}
                            <div 
                                style={{
                                    position: 'absolute',
                                    top: -4,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: 0,
                                    height: 0,
                                    borderLeft: '5px solid transparent',
                                    borderRight: '5px solid transparent',
                                    borderBottom: `5px solid ${isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)'}`,
                                    zIndex: 10
                                }}
                            />

                            {/* Auto-dismiss progress timer bar */}
                            {showAutoTooltip && !isHovered && (
                                <motion.div
                                    className="absolute bottom-0 left-0 h-[2px]"
                                    style={{ backgroundColor: '#3b82f6', opacity: 0.8 }}
                                    initial={{ width: '100%' }}
                                    animate={{ width: '0%' }}
                                    transition={{ duration: 4, ease: 'linear' }}
                                />
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Streak Button — SaaS capsule ─── */}
            <motion.button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="relative flex items-center gap-2 h-9 pl-1.5 pr-3 rounded-xl cursor-pointer"
                style={{
                    background: isDarkMode ? 'rgba(255,255,255,0.04)' : '#ffffff',
                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                    boxShadow: isDarkMode ? 'none' : '0 1px 2px rgba(0,0,0,0.04)',
                    outline: 'none',
                }}
                whileHover={{
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                    boxShadow: isDarkMode ? '0 1px 4px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.06)',
                }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15 }}
            >
                {/* Fire icon in tinted circle */}
                <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                        backgroundColor: isDarkMode ? 'rgba(251,146,60,0.12)' : 'rgba(251,146,60,0.08)',
                    }}
                >
                    <span className="text-xs leading-none">{tier.flameEmoji}</span>
                </div>

                {/* Count + label */}
                <div className="flex items-baseline gap-1">
                    <span
                        className="text-[13px] font-bold leading-none tabular-nums"
                        style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}
                    >
                        {streakData.currentStreak}
                    </span>
                    <span
                        className="text-[10px] font-medium leading-none"
                        style={{ color: isDarkMode ? '#64748b' : '#94a3b8' }}
                    >
                        {streakData.currentStreak === 1 ? 'day' : 'days'}
                    </span>
                </div>

                {/* Chevron indicator */}
                <svg
                    width="10" height="10" viewBox="0 0 24 24"
                    fill="none" stroke={isDarkMode ? '#475569' : '#cbd5e1'}
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                    }}
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </motion.button>

            {/* ─── Dropdown Panel ─── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={dropdownRef}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                        className="absolute top-full mt-2 w-[280px] rounded-xl overflow-hidden z-50"
                        style={{
                            left: '50%',
                            marginLeft: '-140px',
                            backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                            boxShadow: isDarkMode
                                ? '0 16px 48px -12px rgba(0,0,0,0.5)'
                                : '0 16px 48px -12px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.02)',
                        }}
                    >
                        {/* ── Header: Count + Message ── */}
                        <div className="px-5 pt-5 pb-4">
                            <div className="flex items-center gap-3">
                                <motion.span
                                    className="text-2xl"
                                    animate={showWelcome ? {
                                        scale: [1, 1.2, 1],
                                        rotate: [0, -8, 8, 0]
                                    } : {}}
                                    transition={{ duration: 0.5 }}
                                >
                                    {tier.flameEmoji}
                                </motion.span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-1.5">
                                        <span
                                            className="text-2xl font-extrabold leading-none"
                                            style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}
                                        >
                                            {streakData.currentStreak}
                                        </span>
                                        <span
                                            className="text-sm font-bold"
                                            style={{
                                                background: streakData.currentStreak >= 90
                                                    ? 'linear-gradient(135deg, #b9f2ff, #e0f7ff, #7dd3fc, #bae6fd, #67e8f9, #e0f7ff)'
                                                    : streakData.currentStreak >= 30
                                                    ? 'linear-gradient(135deg, #d4a853, #f5e6a3, #b8902e, #f5e6a3, #d4a853)'
                                                    : streakData.currentStreak >= 10
                                                    ? 'linear-gradient(135deg, #8e9aaf, #cfd8e3, #a0aec0, #e2e8f0, #8e9aaf)'
                                                    : streakData.currentStreak >= 1
                                                    ? 'linear-gradient(135deg, #a0714f, #d4a574, #8b6339, #c9956b, #a0714f)'
                                                    : 'none',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: streakData.currentStreak >= 1 ? 'transparent' : undefined,
                                                color: streakData.currentStreak >= 1
                                                    ? 'transparent'
                                                    : (isDarkMode ? '#94a3b8' : '#334155'),
                                            } as React.CSSProperties}
                                        >
                                            day streak
                                        </span>
                                    </div>
                                    <p
                                        className="text-[11px] mt-1 leading-tight"
                                        style={{ color: isDarkMode ? '#cbd5e1' : '#334155' }}
                                    >
                                        {getMessage()}
                                    </p>
                                </div>
                                {/* XP badge */}
                                <div
                                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold shrink-0"
                                    style={{
                                        backgroundColor: isDarkMode ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)',
                                        color: isDarkMode ? '#93c5fd' : '#3b82f6',
                                    }}
                                >
                                    +{tier.xpBonus} XP
                                </div>
                            </div>

                            {/* Progress bar toward next milestone */}
                            <div className="mt-3">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span
                                        className="text-[10px] font-medium"
                                        style={{ color: isDarkMode ? '#cbd5e1' : '#334155' }}
                                    >
                                        Progress
                                    </span>
                                    <span
                                        className="text-[10px] font-medium"
                                        style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}
                                    >
                                        {streakData.currentStreak}/{getNextMilestone()} days
                                    </span>
                                </div>
                                <div
                                    className="h-1 w-full rounded-full overflow-hidden"
                                    style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
                                >
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: '#3b82f6' }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${getProgress() * 100}%` }}
                                        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1], delay: 0.15 }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ── Weekly Activity ── */}
                        <div className="px-5 py-4">
                            <div className="flex items-center justify-between mb-3">
                                <span
                                    className="text-[10px] font-bold uppercase tracking-widest"
                                    style={{ color: isDarkMode ? '#475569' : '#94a3b8' }}
                                >
                                    Activity
                                </span>
                                <span
                                    className="text-[10px] font-medium tabular-nums"
                                    style={{ color: isDarkMode ? '#64748b' : '#94a3b8' }}
                                >
                                    Best {streakData.bestStreak}d
                                </span>
                            </div>

                            <div className="flex justify-between items-end">
                                {calendarDays.map((day, index) => (
                                    <motion.div
                                        key={day.date.toISOString()}
                                        className="flex flex-col items-center gap-1"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.04, duration: 0.2 }}
                                    >
                                <span
                                    className="text-[8px] font-semibold uppercase tracking-wider"
                                    style={{
                                        color: day.isToday
                                            ? '#3b82f6'
                                            : (isDarkMode ? '#94a3b8' : '#64748b')
                                    }}
                                        >
                                            {day.dayName.charAt(0)}
                                        </span>
                                        <div
                                            className="relative flex items-center justify-center"
                                            style={{
                                                width: 30,
                                                height: 30,
                                                borderRadius: '50%',
                                                backgroundColor: day.isActive
                                                    ? '#3b82f6'
                                                    : (isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                                                color: day.isActive
                                                    ? '#ffffff'
                                                    : (isDarkMode ? '#475569' : '#cbd5e1'),
                                                fontSize: 11,
                                                fontWeight: day.isActive ? 700 : 500,
                                                transition: 'all 0.2s ease',
                                            }}
                                        >
                                            {day.isActive ? (
                                                <motion.svg
                                                    width="12" height="12" viewBox="0 0 24 24"
                                                    fill="none" stroke="currentColor" strokeWidth="3"
                                                    strokeLinecap="round" strokeLinejoin="round"
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: 'spring', delay: index * 0.04 + 0.1 }}
                                                >
                                                    <polyline points="20 6 9 17 4 12" />
                                                </motion.svg>
                                            ) : (
                                                <span>{day.date.getDate()}</span>
                                            )}
                                            {/* Today ring */}
                                            {day.isToday && (
                                                <motion.div
                                                    className="absolute inset-0 rounded-full"
                                                    style={{
                                                        border: '2px solid #3b82f6',
                                                        opacity: day.isActive ? 0 : 1,
                                                    }}
                                                    animate={!day.isActive ? { scale: [1, 1.15, 1], opacity: [0.8, 0.3, 0.8] } : {}}
                                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                                />
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* ── Stats Cards ── */}
                        <div className="px-5 pb-4 flex gap-2">
                            {[
                                { label: 'Current', value: `${streakData.currentStreak}`, unit: 'days', icon: '🔥' },
                                { label: 'Best', value: `${streakData.bestStreak}`, unit: 'days', icon: '🏆' },
                                { label: 'XP', value: `${streakData.currentStreak * tier.xpBonus}`, unit: 'earned', icon: '⚡' },
                            ].map((stat) => (
                                <div
                                    key={stat.label}
                                    className="flex-1 p-2.5 rounded-lg text-center"
                                    style={{
                                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}`,
                                    }}
                                >
                                    <div className="text-xs mb-1">{stat.icon}</div>
                                    <div
                                        className="text-sm font-bold tabular-nums leading-none"
                                        style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}
                                    >
                                        {stat.value}
                                    </div>
                                    <div
                                        className="text-[8px] font-semibold uppercase tracking-wider mt-1"
                                        style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}
                                    >
                                        {stat.unit}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ── Tip footer ── */}
                        <div
                            className="px-5 py-3 flex items-center gap-2"
                            style={{
                                borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}`,
                                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                            }}
                        >
                            <svg
                                width="12" height="12" viewBox="0 0 24 24" fill="none"
                                stroke={isDarkMode ? '#60a5fa' : '#3b82f6'}
                                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                            >
                                <path d="M12 2a7 7 0 0 1 4 12.75V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.25A7 7 0 0 1 12 2z" />
                                <line x1="9" y1="21" x2="15" y2="21" />
                            </svg>
                            <span
                                className="text-[11px] leading-tight font-medium"
                                style={{ color: isDarkMode ? '#60a5fa' : '#3b82f6' }}
                            >
                                {streakData.currentStreak < 7
                                    ? "Log in daily to build your streak"
                                    : streakData.currentStreak < 14
                                    ? "Keep the momentum going!"
                                    : "You're a streak master!"}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StreakDropdown;
