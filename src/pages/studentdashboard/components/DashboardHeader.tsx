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
        <div className="header-content">
            <div className="header-left">

                <motion.div
                    className="logo flex items-center gap-2.5"
                    onClick={() => { setActiveView('home'); }}
                    style={{ cursor: 'pointer' }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                >
                    {/* Logo Icon */}
                    <div
                        className={cn(
                            "w-[100px] h-10 flex items-center justify-center rounded-xl overflow-hidden border transition-all duration-200",
                            isDarkMode 
                                ? "border-white/[0.06] bg-slate-800" 
                                : "border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                        )}
                    >
                        <img src="/file.svg" alt="STI Logo" className="w-full h-full object-cover" />
                    </div>
                </motion.div>

                <div
                    className="h-5 w-[1px] mx-2"
                    style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
                />
                <StreakDropdown />
            </div>

            <div className="header-center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '600px' }} />

            <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {isDemoMode ? (
                    <>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '4px 10px', borderRadius: '6px',
                                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                border: '1px solid #f59e0b', fontSize: '11px', fontWeight: 600, color: '#b45309' }}
                        >
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#f59e0b' }}
                            />
                            DEMO MODE
                        </motion.div>
                        <motion.button
                            onClick={() => {
                                import('../../../services/studyTimeService').then(({ resetAllData }) => {
                                    resetAllData();
                                    window.location.reload();
                                });
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 12px', borderRadius: '8px',
                                border: '1px solid #fca5a5',
                                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                                color: '#dc2626', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                            title="Exit demo mode and reset all data"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                            Exit Demo
                        </motion.button>
                    </>
                ) : (
                    <motion.button
                        onClick={() => {
                            import('../../../services/studyTimeService').then(({ loadDemoData }) => {
                                loadDemoData();
                                window.location.reload();
                            });
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '6px 12px', borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                            color: '#0369a1', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                        title="Load demo data (temporary - clears on refresh)"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        Demo
                    </motion.button>
                )}
                
                {/* Unified Toolbar & Profile Container */}
                <div className={`flex items-center gap-2 p-1.5 rounded-2xl border transition-all duration-200 ${
                    isDarkMode 
                        ? 'border-slate-700/60 bg-slate-800/90 shadow-[0_1px_3px_rgba(0,0,0,0.3)]' 
                        : 'border-black/[0.08] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
                }`}>
                    <ToolbarExpandable />
                    <div className={`w-[1px] h-8 mx-1 ${isDarkMode ? 'bg-slate-700' : 'bg-zinc-200'}`}></div>
                    <UserProfileDropdown />
                </div>
            </div>
        </div>
    </header>
    );
};

export default DashboardHeader;
