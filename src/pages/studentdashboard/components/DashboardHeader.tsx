/**
 * DashboardHeader — Extracted from StudentDashboard.tsx (Phase 1.4)
 * Modified to support sticky inset card header and scroll-induced outline
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

import UserProfileDropdown from '../../../components/ui/dropdowns/UserProfileDropdown';
import StreakDropdown from '../../../components/ui/dropdowns/StreakDropdown';
import LevelDropdown from '../../../components/ui/dropdowns/LevelDropdown';
import { SidebarTrigger } from '../../../components/ui/sidebar';
import type { DashboardView } from '../types';
import ToolbarExpandable from '../../../components/ui/toolbar/ToolbarExpandable';

// LordIcon is already declared globally elsewhere as type 'any',
// so we don't need to declare it here.



interface DashboardHeaderProps {
    activeView: DashboardView;
    setActiveView: (view: DashboardView) => void;
    isDemoMode: boolean;
    toggleWidgetsSidebar?: () => void;
    isQuickViewActive?: boolean;
    isScrolled?: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    activeView: _activeView,
    setActiveView,
    isDemoMode,
    toggleWidgetsSidebar,
    isQuickViewActive: _isQuickViewActive = false,
    isScrolled = false
}) => {
    const [isDarkMode, setIsDarkMode] = useState(() => 
        typeof document !== 'undefined' && document.body.classList.contains('dark-mode')
    );
    
    useEffect(() => {
        const checkDarkMode = () => {
            setIsDarkMode(document.body.classList.contains('dark-mode'));
        };
        checkDarkMode();
        
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        
        return () => {
            observer.disconnect();
        };
    }, []);

    return (
    <header className={`header inset-header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="header-content relative w-full flex items-center justify-between pl-1 pr-0 sm:px-4">
            <div className="header-left flex items-center gap-1 sm:gap-2 shrink-0">
                {/* Tablet Sidebar Trigger (Hidden on Mobile and Desktop) */}
                <SidebarTrigger className="hidden md:flex lg:hidden mr-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" />

                <div className="relative flex items-center gap-1 sm:gap-2">
                    <StreakDropdown />
                    <LevelDropdown />
                </div>
                
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

            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
                <motion.div
                    className="flex md:hidden items-center shrink-0 pointer-events-auto"
                    onClick={() => { setActiveView('home'); }}
                    style={{ cursor: 'pointer' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    title="Go Home"
                >
                    <div 
                        className="w-[32px] h-[32px] rounded-[10px] flex items-center justify-center shrink-0 overflow-hidden shadow-sm bg-white dark:bg-slate-800"
                        style={{ border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}` }}
                    >
                        <img src="/file.svg" alt="STI Logo" className="w-full h-full object-cover" />
                    </div>
                </motion.div>
                <div className="hidden lg:flex items-center justify-center w-full max-w-[600px] pointer-events-auto">
                    {/* Empty center for desktop */}
                </div>
            </div>

            <div className="header-right flex items-center gap-1 sm:gap-3 shrink-0 -mr-1 sm:mr-0">

                <div className="hidden lg:flex relative z-50 h-[44px] flex-col justify-start">
                    <ToolbarExpandable 
                        barHeight={40}
                        className="!shadow-none lg:shadow-sm lg:bg-white lg:dark:bg-slate-800/80 lg:border lg:border-slate-200 lg:dark:border-slate-700/50 lg:rounded-[14px]" 
                    />
                </div>

                {/* Separator */}
                <div className="hidden lg:block w-px h-6 bg-slate-200 dark:bg-slate-700/50 mx-1"></div>

                <div className="relative flex items-center gap-2 sm:gap-2">
                    <UserProfileDropdown />
                    {toggleWidgetsSidebar && (
                        <button
                            onClick={(e) => {
                                toggleWidgetsSidebar();
                                e.currentTarget.blur();
                            }}
                            className="md:hidden flex items-center justify-center w-8 h-8 rounded-[10px] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-100/80 dark:border-blue-800/30 text-blue-600 dark:text-blue-400 shadow-sm transition-all hover:scale-105 active:scale-95 shrink-0"
                            aria-label="Toggle Quick View"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    </header>
    );
};

export default DashboardHeader;
