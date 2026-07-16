'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { getXPData, getCurrentLevel, getXPNeededForLevel, getXPProgress } from '../../../services/studyTimeService';
import { LevelJourneyModal } from '../../ui/modals';
import { Zap } from 'lucide-react';
import { getProfile, getImages, getSettings } from '@/services/profileService';
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import { CrownBadge } from "@/components/ui/CrownBadge";

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

interface LevelDropdownProps {
    className?: string;
}

const LevelDropdown: React.FC<LevelDropdownProps> = ({ className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 640 : false);
    const [isHovered, setIsHovered] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    
    const [level, setLevel] = useState(() => getCurrentLevel());
    const [xpProgress, setXpProgress] = useState(() => getXPProgress());
    const [isXpExpanded, setIsXpExpanded] = useState(false);
    const [showLevelJourney, setShowLevelJourney] = useState(false);
    
    // User profile data for avatar
    const [profile] = useState(() => getProfile());
    const [profileImage] = useState(() => getImages().profileImage);
    const [showOnlineStatus] = useState(() => getSettings().showOnlineStatus);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const checkDarkMode = () => {
            setIsDarkMode(document.body.classList.contains('dark-mode'));
        };
        checkDarkMode();
        
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const checkXP = () => {
            setXpProgress(getXPProgress());
            setLevel(getCurrentLevel());
        };
        checkXP();
        const interval = setInterval(checkXP, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const modalTarget = document.querySelector('[data-level-journey-modal]');
            if (modalTarget && modalTarget.contains(event.target as Node)) {
                return;
            }
            if (
                dropdownRef.current && 
                !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const getLevelTitle = (lvl: number) => {
        if (lvl < 5) return 'New Scholar';
        if (lvl < 10) return 'Rising Student';
        if (lvl < 20) return 'Dedicated Learner';
        if (lvl < 30) return 'Academic Achiever';
        if (lvl < 40) return 'Honor Student';
        if (lvl < 50) return 'Distinguished Scholar';
        return 'Master Academic';
    };

    return (
        <div className={`${className || ''}`}>
            {showLevelJourney && (
                <LevelJourneyModal 
                    isOpen={showLevelJourney} 
                    onClose={() => setShowLevelJourney(false)} 
                    currentLevel={level} 
                />
            )}

            <motion.button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`level-dropdown-trigger relative flex items-center sm:gap-2.5 sm:p-1 sm:pr-3.5 sm:rounded-[14px] cursor-pointer text-left transition-all duration-300 ${
                    isDarkMode 
                        ? 'sm:bg-slate-800/80 sm:border sm:border-slate-700/50 sm:shadow-sm sm:hover:bg-slate-700' 
                        : 'sm:bg-white sm:border sm:border-slate-200 sm:shadow-sm sm:hover:bg-slate-50'
                }`}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
            >
                <div 
                    className="w-8 h-8 sm:w-[32px] sm:h-[32px] rounded-[10px] flex items-center justify-center shrink-0 shadow-sm"
                    style={{ background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(219, 234, 254, 0.6)' }}
                >
                    <motion.div
                        animate={{ scale: isHovered ? 1.1 : 1, rotate: isHovered ? 5 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Zap className={`w-4 h-4 sm:w-5 sm:h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} strokeWidth={2.5} />
                    </motion.div>
                </div>

                <div className="hidden sm:flex flex-col justify-center min-w-[70px] flex-1">
                    <div 
                        className="text-[13px] font-bold leading-tight whitespace-nowrap flex items-center gap-1"
                        style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}
                    >
                        <span>Level {level}</span>
                    </div>
                    <div 
                        className="text-[10.5px] font-medium mt-0.5 leading-tight whitespace-nowrap truncate"
                        style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}
                    >
                        {getLevelTitle(level)}
                    </div>
                </div>

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

            <DropdownWrapper isMobile={isMobile} isOpen={isOpen} setIsOpen={setIsOpen} dropdownRef={dropdownRef as any} isDarkMode={isDarkMode}>
                <div className="p-4 sm:p-5 flex flex-col gap-5 relative overflow-hidden bg-white dark:bg-slate-900 w-full">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                    <div className="flex flex-col gap-5 relative z-10 w-full">
                        <button 
                            onClick={() => setShowLevelJourney(true)}
                            className="group/rank w-full flex items-center justify-between gap-4 bg-white/60 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 p-3.5 sm:p-4 rounded-[20px] shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 relative overflow-hidden text-left"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover/rank:opacity-100 transition-opacity duration-300 pointer-events-none" />

                            <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0 relative z-10">
                                {/* Circular Icon with Avatar and Badge */}
                                <div className="relative shrink-0 mt-2 mb-2 scale-90 sm:scale-100 origin-left">
                                    <AnimatedCircularProgressBar
                                        max={100}
                                        min={0}
                                        value={xpProgress}
                                        gaugePrimaryColor={level >= 15 ? '#eab308' : level >= 10 ? '#cbd5e1' : '#3b82f6'}
                                        gaugeSecondaryColor={isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(219, 234, 254, 0.6)'}
                                        className="w-[54px] h-[54px] rounded-full transition-all duration-300"
                                    >
                                        <div 
                                            className="absolute inset-[6px] rounded-full flex items-center justify-center shadow-sm overflow-hidden z-10"
                                            style={{ 
                                                background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(219, 234, 254, 0.6)'
                                            }}
                                        >
                                            {profileImage ? (
                                                <img src={profileImage} alt="Profile" className='w-full h-full object-cover' />
                                            ) : (
                                                <div className={`w-full h-full flex items-center justify-center font-bold text-[15px] ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                                    {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                                                </div>
                                            )}
                                        </div>

                                        <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 min-w-[32px] h-[16px] px-1.5 rounded-md flex items-center justify-center text-[9px] font-bold tracking-wider shadow-sm border-[1.5px] z-20 transition-colors duration-300 ${level >= 20 ? 'bg-yellow-400 text-blue-800' : 'bg-blue-500 text-white'} ${isDarkMode ? (showOnlineStatus ? 'border-emerald-400' : 'border-slate-800') : (showOnlineStatus ? 'border-emerald-500' : 'border-white')}`}>
                                            <span className="ml-[0.05em]">{level >= 20 ? 'MAX' : `LV.${level}`}</span>
                                        </div>

                                        {level >= 20 && (
                                            <CrownBadge />
                                        )}
                                    </AnimatedCircularProgressBar>
                                </div>
                                
                                <div className="flex flex-col items-start flex-1 justify-center w-full">
                                    <h3 className="text-[15px] sm:text-[16px] font-bold text-slate-900 dark:text-white tracking-tight break-words whitespace-normal w-full">
                                        {getLevelTitle(level)}
                                    </h3>
                                    <p className="text-[12px] sm:text-[13px] text-slate-500 dark:text-slate-400 font-medium leading-snug mt-0.5 break-words whitespace-normal w-full">
                                        {level >= 20 ? 'Maximum level reached!' : `Next goal: Level ${level + 1}`}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800/80 group-hover/rank:bg-blue-100 dark:group-hover/rank:bg-blue-900 shrink-0 transition-colors relative z-10">
                                <svg className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover/rank:text-blue-600 dark:group-hover/rank:text-blue-400 transition-colors" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                            </div>
                        </button>

                        <div className="w-full flex flex-col gap-2 pt-1 relative z-10">
                            <div className="flex justify-between items-center px-1">
                                <span className="px-2 py-0.5 rounded-md bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-[11px] sm:text-[12px] font-bold tracking-widest uppercase">
                                    {level >= 20 ? 'MAX' : `${getXPData().xpInCurrentLevel} XP`}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] sm:text-[12px] font-bold tracking-widest uppercase">
                                    {level >= 20 ? 'MAX' : `${getXPNeededForLevel(level)} XP`}
                                </span>
                            </div>
                            <div className="h-3 sm:h-3.5 w-full rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.15)] border border-black/5 dark:border-white/5 relative">
                                <motion.div
                                    className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${xpProgress}%` }}
                                    transition={{ duration: 1.2, ease: "easeOut" }}
                                >
                                    <div className="absolute top-0 inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                </motion.div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="border-t border-slate-200 dark:border-slate-700/60 pt-3 relative z-10 flex flex-col">
                        <button 
                            onClick={() => setIsXpExpanded(!isXpExpanded)}
                            className="w-full flex items-center justify-between text-[12px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors focus:outline-none"
                        >
                            <div className="flex items-center gap-1.5">
                                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                How do I earn XP?
                            </div>
                            <motion.div 
                                animate={{ rotate: isXpExpanded ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                            </motion.div>
                        </button>
                        
                        <AnimatePresence initial={false}>
                            {isXpExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="overflow-hidden"
                                >
                                    <div className="pt-4 pb-1 grid grid-cols-2 gap-2.5">
                                        {[
                                            { label: 'Assignments', xp: '+50' },
                                            { label: 'Study Tools', xp: '+10' },
                                            { label: 'Daily Streak', xp: '+20' },
                                            { label: 'Reading', xp: '+5/m' }
                                        ].map(item => (
                                            <div key={item.label} className="bg-white dark:bg-slate-800/80 rounded-[14px] p-2.5 border border-slate-200/80 dark:border-slate-700/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-blue-200 dark:hover:border-blue-800/60 cursor-default group/xp">
                                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 leading-none">{item.label}</span>
                                                <span className="text-[13px] font-bold text-blue-600 dark:text-blue-400 leading-none group-hover/xp:scale-110 transition-transform duration-300">{item.xp}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </DropdownWrapper>
        </div>
    );
};

export default LevelDropdown;
