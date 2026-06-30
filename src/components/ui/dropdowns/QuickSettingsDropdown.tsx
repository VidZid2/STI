import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuickViewSettings } from '../../../contexts/QuickViewSettingsContext';
import { UiverseSwitch } from '../UiverseSwitch';

interface QuickSettingsDropdownProps {
    onOpenFullSettings?: () => void;
}

interface SettingOption {
    id: string;
    icon: React.ReactNode;
    label: string;
    description: string;
    enabled: boolean;
    onToggle: () => void;
}

const QuickSettingsDropdown: React.FC<QuickSettingsDropdownProps> = ({ onOpenFullSettings }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    const {
        settings,
        toggleShowStreak,
        toggleShowUpcoming,
        toggleCompactMode,
        toggleAutoRefresh,
    } = useQuickViewSettings();

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

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const settingsList: SettingOption[] = [
        {
            id: 'streak',
            icon: (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                </svg>
            ),
            label: 'Show Streak',
            description: 'Daily streak card',
            enabled: settings.showStreak,
            onToggle: toggleShowStreak,
        },
        {
            id: 'upcoming',
            icon: (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            label: 'Upcoming',
            description: 'Deadlines section',
            enabled: settings.showUpcoming,
            onToggle: toggleShowUpcoming,
        },
        {
            id: 'compact',
            icon: (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
            ),
            label: 'Compact',
            description: 'Smaller widgets',
            enabled: settings.compactMode,
            onToggle: toggleCompactMode,
        },
        {
            id: 'autoRefresh',
            icon: (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            ),
            label: 'Auto Refresh',
            description: 'Live updates',
            enabled: settings.autoRefresh,
            onToggle: toggleAutoRefresh,
        },
    ];

    return (
        <div ref={dropdownRef} className="relative flex-1">
            {/* Settings Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-center gap-1.5 lg:gap-1 text-[13px] lg:text-[11px] font-bold py-2 lg:py-1.5 px-3 lg:px-2 rounded-[12px] lg:rounded-[10px] transition-colors shadow-sm ${
                    isDarkMode 
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
            >
                <motion.svg 
                    className="w-4 h-4 lg:w-3.5 lg:h-3.5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </motion.svg>
                Settings
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ 
                            type: 'spring',
                            stiffness: 400,
                            damping: 25,
                        }}
                        className={`absolute bottom-full left-0 mb-2 rounded-xl shadow-lg border overflow-hidden z-50 w-[calc(200%+8px)] sm:w-[220px] lg:w-[calc(200%+8px)] sm:max-w-none ${
                            isDarkMode 
                                ? 'bg-slate-800 border-slate-700' 
                                : 'bg-white border-zinc-100'
                        }`}
                    >
                        {/* Header */}
                        <div className={`px-2.5 py-1.5 border-b ${isDarkMode ? 'border-slate-700 bg-slate-700/50' : 'border-zinc-100 bg-zinc-50/50'}`}>
                            <span className={`text-[9px] font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-zinc-400'}`}>Quick View Settings</span>
                        </div>

                        {/* Settings List */}
                        <div className="py-1">
                            {settingsList.map((setting, index) => (
                                <motion.div
                                    key={setting.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    onClick={setting.onToggle}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    className={`flex items-center gap-2 p-2 mx-1.5 my-1 rounded-xl cursor-pointer transition-colors shadow-sm border ${
                                        isDarkMode 
                                            ? 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700/80' 
                                            : 'bg-white border-zinc-200/80 hover:border-zinc-300'
                                    }`}
                                >
                                    <motion.div
                                        whileHover={{ scale: 1.05, rotate: -5 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                        className={`p-1.5 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                                            setting.enabled 
                                                ? (isDarkMode ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600')
                                                : (isDarkMode ? 'bg-zinc-800 border-zinc-700/50 text-zinc-500' : 'bg-slate-50 border-slate-200 text-slate-400')
                                        }`}
                                    >
                                        {React.cloneElement(setting.icon as React.ReactElement<any>, { className: 'w-3.5 h-3.5', strokeWidth: "2.5" })}
                                    </motion.div>
                                    
                                    <div className="flex-1 min-w-0 pr-1 text-left">
                                        <div className={`text-[11.5px] font-bold tracking-tight leading-none mb-0.5 ${
                                            isDarkMode ? 'text-zinc-100' : 'text-zinc-900'
                                        }`}>
                                            {setting.label}
                                        </div>
                                        <div className={`text-[9.5px] font-medium leading-tight ${
                                            isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                                        }`}>
                                            {setting.description}
                                        </div>
                                    </div>

                                    {/* Toggle Switch */}
                                    <div style={{ flexShrink: 0, marginLeft: 'auto', transform: 'scale(0.68)', transformOrigin: 'right' }} className="pointer-events-none">
                                        <UiverseSwitch checked={setting.enabled} onChange={() => {}} />
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Footer - All Settings Link */}
                        {onOpenFullSettings && (
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                whileHover={{ 
                                    backgroundColor: isDarkMode 
                                        ? 'rgba(59, 130, 246, 0.15)' 
                                        : 'rgba(59, 130, 246, 0.08)'
                                }}
                                transition={{ delay: 0.15, backgroundColor: { duration: 0.2, ease: 'easeOut' } }}
                                onClick={() => {
                                    setIsOpen(false);
                                    onOpenFullSettings();
                                }}
                                className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 border-t text-[10px] text-blue-500 ${
                                    isDarkMode 
                                        ? 'border-slate-700' 
                                        : 'border-zinc-100'
                                }`}
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                All Settings
                            </motion.button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default QuickSettingsDropdown;
