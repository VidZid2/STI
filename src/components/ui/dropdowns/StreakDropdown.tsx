'use client';

import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { getStreakData, getStreakTier, type StreakData } from '../../../services/studyTimeService';
import { DailyStreakModal } from '../../modals/DailyStreakModal';
import { Flame, Target, Trophy } from 'lucide-react';


interface StreakDropdownProps {
    className?: string;
}

interface DropdownWrapperProps {
    isMobile: boolean;
    isOpen: boolean;
    setIsOpen: (val: boolean) => void;
    dropdownRef: React.RefObject<HTMLDivElement | null>;
    isDarkMode: boolean;
    children: React.ReactNode;
}

const DropdownWrapper: React.FC<DropdownWrapperProps> = ({ isMobile, isOpen, setIsOpen, dropdownRef, isDarkMode, children }) => {
    const portalTarget = typeof document !== 'undefined' ? document.body : null;

    if (isMobile && portalTarget) {
        return createPortal(
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="mobile-modal-wrapper"
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-auto"
                    >
                        <motion.div
                            className="absolute inset-0 backdrop-blur-md"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.12 }}
                            style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                            }}
                        />
                        <motion.div
                            ref={dropdownRef}
                            initial={{ opacity: 0, y: 15, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 15, scale: 0.95 }}
                            transition={{ duration: 0.2, type: 'spring', stiffness: 400, damping: 30 }}
                            className="relative w-full max-w-[340px] rounded-[2rem] overflow-hidden z-10 shadow-2xl"
                            style={{
                                backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
                                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                                boxShadow: isDarkMode
                                    ? '0 25px 50px -12px rgba(0,0,0,0.7)'
                                    : '0 25px 50px -12px rgba(0,0,0,0.15)',
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {children}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>,
            portalTarget
        );
    }
    
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    key="desktop-dropdown-wrapper"
                    className="absolute top-full mt-2 z-50 left-0 right-0"
                >
                    <motion.div
                        ref={dropdownRef}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                        className="w-full min-w-[280px] rounded-2xl overflow-hidden origin-top"
                        style={{
                            backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
                            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                            boxShadow: isDarkMode
                                ? '0 16px 48px -12px rgba(0,0,0,0.5)'
                                : '0 16px 48px -12px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.02)',
                        }}
                    >
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const StreakDropdown: React.FC<StreakDropdownProps> = ({ className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 640 : false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [streakData, setStreakData] = useState<StreakData>(() => getStreakData());
    const [showWelcome, setShowWelcome] = useState(false);
    const [showStreakModal, setShowStreakModal] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    const [tutorialsCompleted, setTutorialsCompleted] = useState(false);
    const [introCompleted, setIntroCompleted] = useState(false);
    const [componentReady, setComponentReady] = useState(false);
    const shouldReduceMotion = useReducedMotion();
    const [isHovered, setIsHovered] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Check if tutorials and intro are completed
    useEffect(() => {
        const checkStatus = () => {
            const welcomeCompleted = localStorage.getItem('welcome-modal-completed') === 'true';
            const tutorialCompleted = localStorage.getItem('tutorial-completed') === 'true';
            setTutorialsCompleted(welcomeCompleted && tutorialCompleted);
            
            const introStored = sessionStorage.getItem('dashboardIntroShown');
            setIntroCompleted(introStored === 'true' || introStored === 'done');
        };
        
        checkStatus();
        
        // Listen for storage changes (in case tutorial completes while component is mounted)
        const handleStorageChange = () => checkStatus();
        window.addEventListener('storage', handleStorageChange);
        
        // Also poll periodically in case localStorage/sessionStorage changes in same tab
        const pollInterval = setInterval(checkStatus, 1000);
        
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
        if (!introCompleted) return; // Wait for intro curtain animation to finish
        
        // Check if modal was already shown today
        const today = new Date().toDateString();
        const lastShownDate = localStorage.getItem('streak-modal-last-shown');
        if (lastShownDate === today) return;
        
        // If tutorials are completed, show immediately
        // If not, wait a bit longer to avoid conflicting with other modals
        const delay = tutorialsCompleted ? 300 : 2000;
        
        const timer = setTimeout(() => {
            // Get current streak data
            const data = getStreakData();
            setStreakData(data);
            
            // Show modal and mark as shown for today
            localStorage.setItem('streak-modal-last-shown', today);
            setShowWelcome(true);
            setShowStreakModal(true);
            setTimeout(() => setShowWelcome(false), 3000);
        }, delay);
        
        return () => clearTimeout(timer);
    }, [componentReady, tutorialsCompleted, introCompleted]);



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
    const bestTier = getStreakTier(streakData.bestStreak);

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
        <div className={`${className || ''}`}>
            {/* Daily Streak Modal - shows on first visit of the day */}
            <DailyStreakModal
                isOpen={showStreakModal}
                onClose={() => setShowStreakModal(false)}
                streakData={streakData}
            />

            {/* Obsolete tooltip removed - now handled by DailyToasts */}

            {/* ─── Premium SaaS Streak Button (Tools Page Aesthetic) ─── */}
            <motion.button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`streak-dropdown-trigger relative flex items-center sm:gap-2.5 sm:p-1 sm:pr-3.5 sm:rounded-[14px] cursor-pointer text-left transition-all duration-300 ${
                    isDarkMode 
                        ? 'sm:bg-slate-800/80 sm:border sm:border-slate-700/50 sm:shadow-sm sm:hover:bg-slate-700' 
                        : 'sm:bg-white sm:border sm:border-slate-200 sm:shadow-sm sm:hover:bg-slate-50'
                }`}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
            >
                {/* Tools Page Style SVG Icon Container */}
                <div 
                    className="w-8 h-8 sm:w-[32px] sm:h-[32px] rounded-[10px] flex items-center justify-center shrink-0 shadow-sm"
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
            <DropdownWrapper isMobile={isMobile} isOpen={isOpen} setIsOpen={setIsOpen} dropdownRef={dropdownRef as any} isDarkMode={isDarkMode}>
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
                                    {/* XP Style Activity Badge */}
                                    <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/50 flex items-center justify-center">
                                        <span className="text-[12px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                                            Activity
                                        </span>
                                    </div>
                                    
                                    {/* Tier System Best Streak Badge */}
                                    <div 
                                        className="px-3 py-1 rounded-lg border flex items-center gap-1.5 justify-center shadow-sm"
                                        style={{ background: bestTier.bgGradient, borderColor: bestTier.borderColor }}
                                    >
                                        <Trophy className="w-3.5 h-3.5" style={{ color: bestTier.textColor }} strokeWidth={3} />
                                        <span className="text-[12px] font-bold uppercase tracking-wide" style={{ color: bestTier.textColor }}>
                                            Best {streakData.bestStreak}d
                                        </span>
                                    </div>
                                </div>

                                <div className="relative flex w-full pt-8 pb-6 items-center">
                                    {/* Curved Connecting Path */}
                                    <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 84">
                                        {calendarDays.slice(0, -1).map((day, i) => {
                                            const nextDay = calendarDays[i + 1];
                                            const isActiveSegment = day.isActive && nextDay.isActive;
                                            const x1 = ((i + 0.5) / 7) * 100;
                                            const x2 = ((i + 1.5) / 7) * 100;
                                            const waveOffsets = [0, 14, 2, -14, -4, 14, 4];
                                            const y1 = 42 + waveOffsets[i];
                                            const y2 = 42 + waveOffsets[i + 1];
                                            
                                            // Control points for smooth horizontal S-curve
                                            const cp1x = x1 + 6.5;
                                            const cp2x = x2 - 6.5;
                                            const d = `M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`;
                                            return (
                                                <g key={`path-${i}`}>
                                                    <path 
                                                        d={d} 
                                                        fill="none" 
                                                        stroke={isDarkMode ? 'rgba(30,41,59,0.8)' : '#f1f5f9'} 
                                                        strokeWidth="12" 
                                                        strokeLinecap="round"
                                                        vectorEffect="non-scaling-stroke"
                                                    />
                                                    {isActiveSegment && (
                                                        <path 
                                                            d={d} 
                                                            fill="none" 
                                                            stroke="#3b82f6" 
                                                            strokeWidth="12" 
                                                            strokeLinecap="round"
                                                            vectorEffect="non-scaling-stroke"
                                                            className="transition-all duration-500"
                                                        />
                                                    )}
                                                </g>
                                            );
                                        })}
                                    </svg>

                                    {(() => {
                                        let currentDayCount = 0;
                                        return calendarDays.map((day, index) => {
                                            if (day.isActive) currentDayCount++;
                                            else currentDayCount = 0;
                                            
                                            const stableKey = day.date.toISOString().split('T')[0];
                                        // Winding path vertical offsets for the 7 days (matches the SVG exactly)
                                        const waveOffsets = [0, 14, 2, -14, -4, 14, 4];
                                        const yOffset = waveOffsets[index];
                                        
                                        return (
                                            <div key={stableKey} className="flex-1 flex justify-center items-center z-10">
                                                <motion.div
                                                    className="relative flex flex-col items-center gap-2"
                                                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: yOffset }}
                                                    transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
                                                >
                                                {/* Day Name Above */}
                                                <span
                                                    className="text-[10px] font-bold uppercase absolute -top-5"
                                                    style={{
                                                        color: day.isToday
                                                            ? '#3b82f6'
                                                            : (isDarkMode ? '#64748b' : '#94a3b8')
                                                    }}
                                                >
                                                    {day.dayName.charAt(0)}
                                                </span>

                                                <div
                                                    className={`relative w-[34px] h-[28px] rounded-[50%] flex items-center justify-center transition-all duration-200 outline-none ${
                                                        day.isActive
                                                            ? "bg-[#fbbf24] bg-[linear-gradient(140deg,rgba(255,255,255,0.4)_0%,rgba(255,255,255,0.15)_35%,transparent_50%,rgba(0,0,0,0.06)_80%,rgba(0,0,0,0.1)_100%)] text-blue-700 shadow-[0_4px_0_0_#d97706,inset_0_-1px_0_0_rgba(0,0,0,0.12),inset_0_1px_0_0_rgba(255,255,255,0.45)]"
                                                            : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 shadow-[0_4px_0_0_#cbd5e1,inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[0_4px_0_0_#0f172a,inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                                                    }`}
                                                >
                                                    <div className="relative z-10 flex items-center justify-center">
                                                        {day.isActive ? (
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm">
                                                                <polyline points="20 6 9 17 4 12" />
                                                            </svg>
                                                        ) : (
                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Crown/Date Badge */}
                                                <div className="absolute -bottom-2 -right-1 z-20">
                                                    {day.isActive ? (
                                                        <div className="relative flex justify-center">
                                                            <svg width="18" height="15" viewBox="0 0 32 26" className="w-[18px] h-auto drop-shadow-sm">
                                                                <g transform="translate(1, 1)">
                                                                    <path d="M7.756,6.993 L12.632,1.882 C13.2378543,1.2469304 14.0729018,0.881084131 14.9504851,0.866238503 C15.8280684,0.851392876 16.6750122,1.18878575 17.302,1.803 L22.594,6.989 L25.437,4.728 C26.2761293,4.06050369 27.4491145,4.00759997 28.3449252,4.59684738 C29.2407359,5.1860948 29.656646,6.28414389 29.376,7.319 L25.67,20.971 C25.3391114,22.1908879 24.2319674,23.0380001 22.968,23.0380001 L6.908,23.0380001 C5.64366103,23.0382922 4.53598585,22.1912465 4.205,20.971 L0.555,7.518 C0.260731262,6.43355938 0.685695545,5.28174032 1.61378175,4.64828824 C2.54186795,4.01483615 3.76934805,4.03880272 4.672,4.708 L7.755,6.993 L7.756,6.993 Z" stroke="#FFFFFF" strokeWidth="2" fill="#FFC800" />
                                                                    <path d="M6.16,9.002 L7.259,9.944 C7.44099992,10.1000604 7.6777443,10.1770545 7.91672577,10.157906 C8.15570725,10.1387574 8.37717145,10.025049 8.532,9.842 L11.249,6.63 C11.5471503,6.27645891 12.0293501,6.13807859 12.4696049,6.27971432 C12.9098596,6.42135006 13.22092,6.81493261 13.257,7.276 L14.193,19.063 C14.218112,19.3800921 14.1096022,19.6932559 13.893686,19.9268329 C13.6777697,20.1604098 13.3740849,20.2931557 13.056,20.2930001 L8.576,20.2930001 C8.05674812,20.2927533 7.60326841,19.9416457 7.473,19.439 L4.965,9.747 C4.88514303,9.43484923 5.016732,9.10693867 5.29021683,8.93658232 C5.56370166,8.76622597 5.91603726,8.79269522 6.161,9.002 L6.16,9.002 Z" fill="#FFDE00" />
                                                                    <text x="15" y="17.5" textAnchor="middle" fill="#b45309" fontSize="11.5" fontWeight="900" fontFamily="sans-serif">
                                                                        {currentDayCount}
                                                                    </text>
                                                                </g>
                                                            </svg>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </motion.div>
                                            </div>
                                        );
                                    })})()}
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
                                    <div className="px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800/50 flex items-center gap-1.5 justify-center shadow-sm mb-1.5">
                                        <Flame className="w-4 h-4 text-orange-500" fill="currentColor" />
                                        <span className="text-[14px] font-bold tracking-wide text-orange-600 dark:text-orange-400">
                                            {streakData.currentStreak}
                                        </span>
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
                                    <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/50 flex items-center gap-1.5 justify-center shadow-sm mb-1.5">
                                        <Trophy className="w-4 h-4 text-slate-500 dark:text-slate-400" strokeWidth={2.5} />
                                        <span className="text-[14px] font-bold tracking-wide text-slate-700 dark:text-slate-300">
                                            {streakData.bestStreak}
                                        </span>
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
                                    <motion.div 
                                        className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/50 flex items-center justify-center shadow-sm mb-1.5"
                                        animate={{ scale: [1, 1.04, 1] }}
                                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                                    >
                                        <span className="text-[14px] font-bold tracking-wide text-blue-600 dark:text-blue-400">
                                            +{streakData.currentStreak * tier.xpBonus} XP
                                        </span>
                                    </motion.div>
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
            </DropdownWrapper>
        </div>
    );
};

export default StreakDropdown;
