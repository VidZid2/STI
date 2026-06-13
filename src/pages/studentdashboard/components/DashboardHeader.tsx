/**
 * DashboardHeader — Extracted from StudentDashboard.tsx (Phase 1.4)
 * Pure presentational component — receives all state via props.
 * Zero logic changes from the original.
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import ToolbarExpandable from '../../../components/ui/toolbar/ToolbarExpandable';
import UserProfileDropdown from '../../../components/ui/dropdowns/UserProfileDropdown';


import StreakDropdown from '../../../components/ui/dropdowns/StreakDropdown';
import type { DashboardView } from '../types';
interface DashboardHeaderProps {
    setActiveView: (view: DashboardView) => void;
    isDemoMode: boolean;
    toggleWidgetsSidebar?: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    setActiveView,
    isDemoMode,
    toggleWidgetsSidebar
}) => {
    const [isDarkMode, setIsDarkMode] = useState(() => 
        typeof document !== 'undefined' && document.body.classList.contains('dark-mode')
    );
    const [isHeaderHidden, setIsHeaderHidden] = useState(false);
    const lastScrollY = useRef(0);
    
    useEffect(() => {
        const checkDarkMode = () => {
            setIsDarkMode(document.body.classList.contains('dark-mode'));
        };
        checkDarkMode();
        
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        
        const handleScroll = () => {
            const currentY = window.scrollY;
            const delta = currentY - lastScrollY.current;

            // Dead-zone: ignore micro-scrolls smaller than 5px
            if (Math.abs(delta) < 5) return;

            if (delta > 0 && currentY > 60) {
                // Scrolling DOWN past 60px → hide
                setIsHeaderHidden(true);
            } else if (delta < 0) {
                // Scrolling UP even a little → show
                setIsHeaderHidden(false);
            }

            lastScrollY.current = currentY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        
        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
    <header className={`header ${isHeaderHidden ? 'header-hidden' : ''}`}>
        <div className="header-content w-full flex items-center justify-between px-1 sm:px-4">
            <div className="header-left flex items-center gap-1 sm:gap-2 shrink-0">

                <motion.div
                    className="logo flex items-center gap-1 sm:gap-2.5 shrink-0"
                    onClick={() => { setActiveView('home'); }}
                    style={{ cursor: 'pointer' }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                >
                    {/* Premium SaaS Logo Container (Study Tools Style) */}
                    <div 
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden"
                        style={{ border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}` }}
                    >
                        <img src="/file.svg" alt="STI Logo" className="w-full h-full object-cover" />
                    </div>
                    
                    {/* Text Content matching Tools Page Cards */}
                    <div className="flex-1 min-w-0 hidden sm:flex flex-col justify-center text-left">
                        <div 
                            className="text-[13px] font-bold leading-tight whitespace-nowrap"
                            style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}
                        >
                            STI eLMS
                        </div>
                        <div 
                            className="text-[10.5px] font-medium mt-0.5 leading-tight whitespace-nowrap truncate"
                            style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}
                        >
                            Student Dashboard
                        </div>
                    </div>
                </motion.div>

                {/* Mobile ONLY: "Overview Ready" Header Status Pill */}
                <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="sm:hidden flex items-center gap-1.5 ml-1 px-2.5 py-1.5 rounded-full border border-blue-100/50 dark:border-blue-800/30 bg-blue-50/50 dark:bg-blue-900/20"
                >
                    <svg className="w-3 h-3 shrink-0 text-blue-500/80 dark:text-blue-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    <span className="text-[10px] font-bold tracking-wide text-blue-700 dark:text-blue-300">
                        Overview Ready
                    </span>
                </motion.div>

                <div
                    className="h-5 w-[1px] mx-1 sm:mx-2 hidden sm:block"
                    style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
                />
                <StreakDropdown />
                
                {/* Demo Mode Indicator */}
                {isDemoMode && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 rounded-lg"
                    >
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                            Demo
                        </span>
                    </motion.div>
                )}
            </div>

            <div className="header-center hidden md:flex items-center justify-center w-full max-w-[600px]" />

            <div className="header-right flex items-center gap-0.5 sm:gap-3 shrink-0">
                <ToolbarExpandable />
                {toggleWidgetsSidebar && (
                    <button
                        onClick={toggleWidgetsSidebar}
                        className="md:hidden flex items-center justify-center w-8 h-8 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                        aria-label="Toggle Quick View"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                        </svg>
                    </button>
                )}
                <div className={`w-[1px] h-6 sm:h-8 mx-0.5 sm:mx-2 ${isDarkMode ? 'bg-slate-700/50' : 'bg-zinc-200'}`}></div>
                <UserProfileDropdown />
            </div>
        </div>
    </header>
    );
};

export default DashboardHeader;
