/**
 * DashboardHeader — Extracted from StudentDashboard.tsx (Phase 1.4)
 * Modified to support sticky inset card header and scroll-induced outline
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import ToolbarExpandable from '../../../components/ui/toolbar/ToolbarExpandable';
import UserProfileDropdown from '../../../components/ui/dropdowns/UserProfileDropdown';
import StreakDropdown from '../../../components/ui/dropdowns/StreakDropdown';
import { SidebarTrigger } from '../../../components/ui/sidebar';
import type { DashboardView } from '../types';

interface DashboardHeaderProps {
    setActiveView: (view: DashboardView) => void;
    isDemoMode: boolean;
    toggleWidgetsSidebar?: () => void;
    isQuickViewActive?: boolean;
    isScrolled?: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
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
        <div className="header-content w-full flex items-center justify-between px-1 sm:px-4">
            <div className="header-left flex items-center gap-1 sm:gap-2 shrink-0">
                {/* Tablet Sidebar Trigger (Hidden on Mobile and Desktop) */}
                <SidebarTrigger className="hidden md:flex lg:hidden mr-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" />

                <motion.div
                    className="logo flex md:!hidden items-center gap-1 sm:gap-2.5 shrink-0"
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
                </motion.div>


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

            <div className="header-right flex items-center gap-1 sm:gap-3 shrink-0">
                <div className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 z-10">
                    <ToolbarExpandable />
                </div>
                {toggleWidgetsSidebar && (
                    <button
                        onClick={toggleWidgetsSidebar}
                        className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-100/80 dark:border-blue-800/30 text-blue-600 dark:text-blue-400 shadow-sm transition-all hover:scale-105 active:scale-95"
                        aria-label="Toggle Quick View"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                        </svg>
                    </button>
                )}

                <div className={`hidden md:block w-[1px] h-6 sm:h-8 mx-0.5 sm:mx-2 ${isDarkMode ? 'bg-slate-700/50' : 'bg-zinc-200'}`}></div>
                
                <UserProfileDropdown />
            </div>
        </div>
    </header>
    );
};

export default DashboardHeader;
