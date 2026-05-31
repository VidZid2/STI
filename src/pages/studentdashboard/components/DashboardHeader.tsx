/**
 * DashboardHeader — Extracted from StudentDashboard.tsx (Phase 1.4)
 * Pure presentational component — receives all state via props.
 * Zero logic changes from the original.
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import ToolbarExpandable from '../../../components/ui/toolbar/ToolbarExpandable';
import UserProfileDropdown from '../../../components/ui/dropdowns/UserProfileDropdown';

import { cn } from '../../../lib/utils';
import StreakDropdown from '../../../components/ui/dropdowns/StreakDropdown';
import type { DashboardView } from '../types';
interface DashboardHeaderProps {
    setActiveView: (view: DashboardView) => void;
    isDemoMode: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    setActiveView,
    isDemoMode 
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
        
        return () => observer.disconnect();
    }, []);

    return (
    <header className="header">
        <div className="header-content w-full flex items-center justify-between px-2 sm:px-4">
            <div className="header-left flex items-center gap-1 sm:gap-2">

                <motion.div
                    className="logo flex items-center gap-1.5 sm:gap-2.5"
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

                <div
                    className="h-5 w-[1px] mx-1 sm:mx-2 hidden sm:block"
                    style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
                />
                <StreakDropdown />
            </div>

            <div className="header-center hidden md:flex items-center justify-center w-full max-w-[600px]" />

            <div className="header-right flex items-center gap-1.5 sm:gap-3">
                <ToolbarExpandable />
                <div className={`w-[1px] h-8 mx-0.5 sm:mx-2 ${isDarkMode ? 'bg-slate-700/50' : 'bg-zinc-200'}`}></div>
                <UserProfileDropdown />
            </div>
        </div>
    </header>
    );
};

export default DashboardHeader;
