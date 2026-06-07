'use client';

import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { getStreakData, getStreakTier, type StreakData } from '../../../services/studyTimeService';
import { DailyStreakModal } from '../../modals/DailyStreakModal';
import { Flame, Target } from 'lucide-react';


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
    const shouldReduceMotion = useReducedMotion();
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
        
        // FOR TESTING: Always show modal on reload
        // const modalShownThisSession = sessionStorage.getItem(STREAK_MODAL_SHOWN_KEY) === 'true';
        // if (modalShownThisSession) return;
        
        // If tutorials are completed, show immediately
        // If not, wait a bit longer to avoid conflicting with other modals
        const delay = tutorialsCompleted ? 300 : 2000;
        
        const timer = setTimeout(() => {
            // Get current streak data
            const data = getStreakData();
            setStreakData(data);
            
            // Show modal and mark as shown for this session
            // sessionStorage.setItem(STREAK_MODAL_SHOWN_KEY, 'true');
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
            {/* Auto-playing & hover tooltip - beautiful premium SaaS design */}
            <AnimatePresence>
                {((showAutoTooltip && tutorialsCompleted) || isHovered) && !isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-full mt-2.5 z-50 left-0 sm:left-1/2 sm:-translate-x-1/2 pointer-events-none"
                    >
                        <motion.div
                            initial={{ y: 8 }}
                            animate={{ y: 0 }}
                            exit={{ y: 4 }}
                            transition={{ type: 'spring', stiffness: 450, damping: 26 }}
                            className="w-[250px] pointer-events-auto"
                        >
                            <div
                                className="p-3.5 rounded-2xl flex items-center gap-3.5 backdrop-blur-xl"
                                style={{
                                    backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                                    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'}`,
                                    boxShadow: isDarkMode 
                                        ? '0 10px 40px -10px rgba(0, 0, 0, 0.5), 0 1px 3px rgba(0,0,0,0.2)'
                                        : '0 10px 40px -10px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0,0,0,0.02)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                            {/* Tools Page Style SVG Icon Container */}
                            <div 
                                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                                style={{ background: isDarkMode ? 'rgba(249, 115, 22, 0.15)' : 'rgba(255, 237, 213, 0.6)' }}
                            >
                                <motion.div
                                    animate={shouldReduceMotion ? { scale: 1, rotate: 0 } : { scale: [1, 1.05, 0.98, 1.02, 1], rotate: [0, 3, -2, 1, 0] }}
                                    transition={shouldReduceMotion ? { duration: 0 } : { repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                                >
                                    <Flame className={`w-5 h-5 ${isDarkMode ? 'text-orange-400' : 'text-orange-500'}`} strokeWidth={2.5} />
                                </motion.div>
                            </div>

                            {/* Text Content matching Tools Page Cards */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center" style={{ textAlign: 'left' }}>
                                <div 
                                    className="text-[13px] font-bold leading-tight whitespace-nowrap"
                                    style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}
                                >
                                    Daily Streak
                                </div>
                                <div 
                                    className="text-[10.5px] font-medium mt-0.5 leading-tight whitespace-nowrap truncate"
                                    style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}
                                >
                                    {getTooltipMessage()}
                                </div>
                            </div>

                            {/* Arrow Pointer */}
                            <div 
                                className="absolute -top-[5px] left-[20px] sm:left-1/2 sm:-translate-x-1/2 z-10"
                                style={{
                                    width: 0,
                                    height: 0,
                                    borderLeft: '5px solid transparent',
                                    borderRight: '5px solid transparent',
                                    borderBottom: `5px solid ${isDarkMode ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.85)'}`,
                                }}
                            />

                            {/* Auto-dismiss progress timer bar */}
                            {showAutoTooltip && !isHovered && (
                                <motion.div
                                    className="absolute bottom-0 left-0 h-[2px]"
                                    style={{ backgroundColor: '#f97316', opacity: 0.8 }}
                                    initial={{ width: '100%' }}
                                    animate={{ width: '0%' }}
                                    transition={{ duration: 4, ease: 'linear' }}
                                />
                            )}
                        </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Premium SaaS Streak Button (Tools Page Aesthetic) ─── */}
            <motion.button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`relative flex items-center sm:gap-3 sm:p-1.5 sm:pr-4 sm:rounded-2xl cursor-pointer text-left transition-all duration-300 ${
                    isDarkMode 
                        ? 'sm:border sm:border-slate-700/60 sm:bg-slate-800/40 sm:hover:bg-slate-800/80 sm:shadow-[0_2px_8px_rgba(0,0,0,0.2)]' 
                        : 'sm:border sm:border-zinc-200/80 sm:bg-white/60 sm:hover:bg-white sm:hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] sm:backdrop-blur-md'
                }`}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
            >
                {/* Tools Page Style SVG Icon Container */}
                <div 
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                    style={{ background: isDarkMode ? 'rgba(249, 115, 22, 0.15)' : 'rgba(255, 237, 213, 0.6)' }}
                >
                    <motion.div
                        animate={{ scale: isHovered ? 1.1 : 1, rotate: isHovered ? 5 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Flame className={`w-4 h-4 sm:w-5 sm:h-5 ${isDarkMode ? 'text-orange-400' : 'text-orange-500'}`} strokeWidth={2.5} />
                    </motion.div>
                </div>

                {/* Text Content matching Tools Page Cards */}
                <div className="hidden sm:flex flex-col justify-center min-w-[70px] flex-1">
                    <div 
                        className="text-[13px] font-bold leading-tight whitespace-nowrap flex items-center gap-1"
                        style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}
                    >
                        <span>{streakData.currentStreak}</span>
                        <span>Days</span>
                    </div>
                    <div 
                        className="text-[10.5px] font-medium mt-0.5 leading-tight whitespace-nowrap truncate"
                        style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}
                    >
                        {streakData.currentStreak > 0 ? 'Active Streak' : 'Start Streak'}
                    </div>
                </div>

                {/* Chevron indicator (Hidden on Mobile) */}
                <div className="hidden sm:flex items-center justify-center w-5 h-5 ml-1">
                    <svg
                        className="w-[14px] h-[14px]" viewBox="0 0 24 24"
                        fill="none" stroke={isDarkMode ? '#64748b' : '#94a3b8'}
                        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        style={{
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                    >
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </div>
            </motion.button>

            {/* ─── Dropdown Panel ─── */}
            <AnimatePresence>
                {isOpen && (
                    <div className="absolute top-full mt-2 z-50 -left-6 sm:left-1/2 sm:-translate-x-1/2">
                        <motion.div
                            ref={dropdownRef}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                            className="w-[340px] max-w-[calc(100vw-16px)] rounded-2xl overflow-hidden origin-top"
                            style={{
                                backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
                                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                                boxShadow: isDarkMode
                                    ? '0 16px 48px -12px rgba(0,0,0,0.5)'
                                    : '0 16px 48px -12px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.02)',
                            }}
                        >
                            {/* ─── PREMIUM STUDY TOOLS LAYOUT ─── */}
                            <div className="p-3.5 flex flex-col gap-3">
                            
                            {/* Card 1: Header / Current Streak */}
                            <div 
                                className="p-4 rounded-2xl flex items-center gap-4 relative overflow-hidden"
                                style={{
                                    backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : '#ffffff',
                                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                                    boxShadow: isDarkMode ? 'none' : '0 2px 8px -2px rgba(0,0,0,0.03)',
                                }}
                            >
                                {/* Premium SVG Icon Container (Study Tools Style) */}
                                <div 
                                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                                    style={{ background: isDarkMode ? 'rgba(249, 115, 22, 0.15)' : 'rgba(255, 237, 213, 0.6)' }}
                                >
                                    <motion.div
                                        animate={showWelcome ? { scale: [1, 1.2, 1], rotate: [0, -8, 8, 0] } : (shouldReduceMotion ? { scale: 1, rotate: 0 } : { scale: [1, 1.05, 0.98, 1.02, 1], rotate: [0, 3, -2, 1, 0] })}
                                        transition={showWelcome ? { duration: 0.6, type: 'spring' } : (shouldReduceMotion ? { duration: 0 } : { repeat: Infinity, duration: 2.5, ease: "easeInOut" })}
                                    >
                                        <Flame className={`w-5 h-5 ${isDarkMode ? 'text-orange-400' : 'text-orange-500'}`} strokeWidth={2.5} />
                                    </motion.div>
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div 
                                        className="text-[13px] font-bold leading-tight whitespace-nowrap flex items-center gap-1.5"
                                        style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}
                                    >
                                        <span>{streakData.currentStreak}</span>
                                        <span
                                            style={{
                                                background: streakData.currentStreak >= 90 ? 'linear-gradient(135deg, #b9f2ff, #e0f7ff, #7dd3fc, #bae6fd, #67e8f9, #e0f7ff)' : streakData.currentStreak >= 30 ? 'linear-gradient(135deg, #d4a853, #f5e6a3, #b8902e, #f5e6a3, #d4a853)' : streakData.currentStreak >= 10 ? 'linear-gradient(135deg, #8e9aaf, #cfd8e3, #a0aec0, #e2e8f0, #8e9aaf)' : streakData.currentStreak >= 1 ? 'linear-gradient(135deg, #a0714f, #d4a574, #8b6339, #c9956b, #a0714f)' : 'none',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: streakData.currentStreak >= 1 ? 'transparent' : undefined,
                                                color: streakData.currentStreak >= 1 ? 'transparent' : (isDarkMode ? '#94a3b8' : '#334155'),
                                            } as React.CSSProperties}
                                        >
                                            Day Streak
                                        </span>
                                    </div>
                                    <div 
                                        className="text-[10.5px] font-medium mt-0.5 leading-tight whitespace-nowrap truncate"
                                        style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}
                                    >
                                        {getMessage()}
                                    </div>
                                </div>
                                {/* Premium XP badge (Study Tools Style) */}
                                <div
                                    className="px-2.5 py-1 rounded-md text-[11px] font-bold shadow-sm shrink-0"
                                    style={{
                                        background: isDarkMode ? 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(37,99,235,0.1) 100%)' : 'linear-gradient(135deg, rgba(239,246,255,1) 0%, rgba(219,234,254,1) 100%)',
                                        color: isDarkMode ? '#93c5fd' : '#2563eb',
                                        border: `1px solid ${isDarkMode ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.2)'}`,
                                    }}
                                >
                                    +{tier.xpBonus} XP
                                </div>
                            </div>

                            {/* Card 2: Weekly Progress (Study Tools Style) */}
                            <div 
                                className="p-4 rounded-2xl relative overflow-hidden"
                                style={{
                                    backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : '#ffffff',
                                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                                    boxShadow: isDarkMode ? 'none' : '0 2px 8px -2px rgba(0,0,0,0.03)',
                                }}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div 
                                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                                        style={{ background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(219, 234, 254, 0.6)' }}
                                    >
                                        <Target className="w-5 h-5 text-blue-500" strokeWidth={2.5} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div 
                                            className="text-[13px] font-bold leading-tight whitespace-nowrap"
                                            style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}
                                        >
                                            Weekly Progress
                                        </div>
                                        <div 
                                            className="text-[10.5px] font-medium mt-0.5 leading-tight whitespace-nowrap truncate"
                                            style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}
                                        >
                                            Hitting your next milestone
                                        </div>
                                    </div>
                                    <div 
                                        className="px-2.5 py-1 rounded-md text-[11px] font-bold shadow-sm shrink-0"
                                        style={{
                                            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#ffffff',
                                            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : '#e2e8f0'}`,
                                            color: isDarkMode ? '#cbd5e1' : '#334155'
                                        }}
                                    >
                                        {streakData.currentStreak} / {getNextMilestone()}
                                    </div>
                                </div>
                                
                                <div className="h-2 w-full rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.15)] border border-black/5 dark:border-white/5">
                                    <motion.div
                                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 relative"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${getProgress() * 100}%` }}
                                        transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1], delay: 0.15 }}
                                    />
                                </div>
                            </div>

                            {/* Card 3: Weekly Activity Calendar */}
                            <div 
                                className="p-4 rounded-2xl relative overflow-hidden"
                                style={{
                                    backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : '#ffffff',
                                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                                    boxShadow: isDarkMode ? 'none' : '0 2px 8px -2px rgba(0,0,0,0.03)',
                                }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <span
                                        className="text-[11px] font-bold uppercase tracking-wider"
                                        style={{ color: isDarkMode ? '#64748b' : '#94a3b8' }}
                                    >
                                        Activity
                                    </span>
                                    <span
                                        className="text-[11px] font-semibold"
                                        style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}
                                    >
                                        Best {streakData.bestStreak}d
                                    </span>
                                </div>

                                <div className="flex justify-between items-end px-1">
                                    {calendarDays.map((day, index) => {
                                        const stableKey = day.date.toISOString().split('T')[0];
                                        return (
                                            <motion.div
                                                key={stableKey}
                                                className="flex flex-col items-center gap-1.5"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: index * 0.04, duration: 0.2 }}
                                            >
                                                <span
                                                    className="text-[10px] font-bold uppercase"
                                                    style={{
                                                        color: day.isToday
                                                            ? '#3b82f6'
                                                            : (isDarkMode ? '#64748b' : '#94a3b8')
                                                    }}
                                                >
                                                {day.dayName.charAt(0)}
                                            </span>
                                            <div
                                                className="relative flex items-center justify-center shadow-sm"
                                                style={{
                                                    width: 30,
                                                    height: 30,
                                                    borderRadius: '50%',
                                                    background: day.isActive
                                                        ? (isDarkMode ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)')
                                                        : (isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc'),
                                                    border: day.isActive 
                                                        ? 'none' 
                                                        : `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : '#e2e8f0'}`,
                                                    color: day.isActive
                                                        ? '#ffffff'
                                                        : (isDarkMode ? '#475569' : '#94a3b8'),
                                                    fontSize: 12,
                                                    fontWeight: day.isActive ? 700 : 600,
                                                    transition: 'all 0.2s ease',
                                                }}
                                            >
                                                {day.isActive ? (
                                                    <motion.svg
                                                        width="13" height="13" viewBox="0 0 24 24"
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
                                            </div>
                                        </motion.div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Card 4: Stats Group Row */}
                            <div className="flex gap-3">
                                {/* Stat A: Days */}
                                <motion.div
                                    className="flex-1 p-3 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden"
                                    style={{
                                        backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : '#ffffff',
                                        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                                        boxShadow: isDarkMode ? 'none' : '0 2px 8px -2px rgba(0,0,0,0.03)',
                                    }}
                                    whileHover={{ y: -2, boxShadow: isDarkMode ? '0 4px 12px rgba(0,0,0,0.4)' : '0 6px 16px -4px rgba(0,0,0,0.08)' }}
                                >
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2 shadow-sm" style={{ background: isDarkMode ? 'rgba(249, 115, 22, 0.15)' : 'rgba(255, 237, 213, 0.6)' }}>
                                        <Flame className="w-4 h-4 text-orange-500" fill="currentColor" />
                                    </div>
                                    <div className="text-[15px] font-bold leading-none mb-1" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                                        {streakData.currentStreak}
                                    </div>
                                    <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: isDarkMode ? '#64748b' : '#94a3b8' }}>
                                        Days
                                    </div>
                                </motion.div>

                                {/* Stat B: Best */}
                                <motion.div
                                    className="flex-1 p-3 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden"
                                    style={{
                                        backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : '#ffffff',
                                        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                                        boxShadow: isDarkMode ? 'none' : '0 2px 8px -2px rgba(0,0,0,0.03)',
                                    }}
                                    whileHover={{ y: -2, boxShadow: isDarkMode ? '0 4px 12px rgba(0,0,0,0.4)' : '0 6px 16px -4px rgba(0,0,0,0.08)' }}
                                >
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2 shadow-sm" style={{ background: isDarkMode ? 'rgba(234, 179, 8, 0.15)' : 'rgba(254, 240, 138, 0.6)' }}>
                                        <svg className="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M8 21h8M12 17v4M7 4h10M6 4h12a2 2 0 0 1 2 2v2a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6V6a2 2 0 0 1 2-2z" />
                                        </svg>
                                    </div>
                                    <div className="text-[15px] font-bold leading-none mb-1" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                                        {streakData.bestStreak}
                                    </div>
                                    <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: isDarkMode ? '#64748b' : '#94a3b8' }}>
                                        Best
                                    </div>
                                </motion.div>

                                {/* Stat C: XP Earned */}
                                <motion.div
                                    className="flex-1 p-3 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden"
                                    style={{
                                        backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : '#ffffff',
                                        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                                        boxShadow: isDarkMode ? 'none' : '0 2px 8px -2px rgba(0,0,0,0.03)',
                                    }}
                                    whileHover={{ y: -2, boxShadow: isDarkMode ? '0 4px 12px rgba(0,0,0,0.4)' : '0 6px 16px -4px rgba(0,0,0,0.08)' }}
                                >
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2 shadow-sm" style={{ background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(219, 234, 254, 0.6)' }}>
                                        <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                        </svg>
                                    </div>
                                    <div className="text-[15px] font-bold leading-none mb-1" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                                        {streakData.currentStreak * tier.xpBonus}
                                    </div>
                                    <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: isDarkMode ? '#64748b' : '#94a3b8' }}>
                                        Earned
                                    </div>
                                </motion.div>
                            </div>

                            {/* Card 5: Tip Banner */}
                            <div
                                className="px-4 py-3 rounded-2xl flex items-center gap-3"
                                style={{
                                    backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.05)' : '#eff6ff',
                                    border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.1)' : '#dbeafe'}`,
                                }}
                            >
                                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(219, 234, 254, 0.8)' }}>
                                    <svg
                                        width="14" height="14" viewBox="0 0 24 24" fill="none"
                                        stroke={isDarkMode ? '#60a5fa' : '#3b82f6'}
                                        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                    >
                                        <path d="M12 2a7 7 0 0 1 4 12.75V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.25A7 7 0 0 1 12 2z" />
                                        <line x1="9" y1="21" x2="15" y2="21" />
                                    </svg>
                                </div>
                                <span
                                    className="text-[11px] font-bold"
                                    style={{ color: isDarkMode ? '#93c5fd' : '#2563eb' }}
                                >
                                    {streakData.currentStreak < 7
                                        ? "Log in daily to build your streak!"
                                        : streakData.currentStreak < 14
                                        ? "Keep the momentum going!"
                                        : "You're a streak master!"}
                                </span>
                            </div>

                        </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StreakDropdown;
