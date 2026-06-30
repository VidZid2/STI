import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { UiverseSwitch } from '../ui/UiverseSwitch';
import { ThemeSwitch } from '../ui/ThemeSwitch';

import { createPortal } from 'react-dom';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface SettingItemProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    enabled: boolean;
    onToggle: () => void;
    delay?: number;
    isDark: boolean;
    isThemeSwitch?: boolean;
}


const SettingItem: React.FC<SettingItemProps> = ({ icon, title, description, enabled, onToggle, delay = 0, isDark, isThemeSwitch }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            onClick={onToggle}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`flex items-center gap-3.5 p-3.5 rounded-[14px] cursor-pointer transition-colors shadow-sm border ${
                isDark 
                    ? 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700/80' 
                    : 'bg-white border-zinc-200/80 hover:border-zinc-300'
            }`}
        >
            <motion.div
                whileHover={{ scale: 1.05, rotate: -5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className={`p-2 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                    enabled 
                        ? (isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600')
                        : (isDark ? 'bg-zinc-800 border-zinc-700/50 text-zinc-500' : 'bg-slate-50 border-slate-200 text-slate-400')
                }`}
            >
                {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-[18px] h-[18px]', strokeWidth: "2.5" })}
            </motion.div>
            
            <div className="flex-1 min-w-0 pr-2">
                <div className={`text-[13px] font-bold tracking-tight leading-none mb-1 ${
                    isDark ? 'text-zinc-100' : 'text-zinc-900'
                }`}>
                    {title}
                </div>
                <div className={`text-[11.5px] font-medium leading-[1.3] ${
                    isDark ? 'text-zinc-400' : 'text-zinc-500'
                }`}>
                    {description}
                </div>
            </div>

            {/* Toggle Switch */}
            <div style={{ flexShrink: 0, marginLeft: '12px', transform: 'scale(0.85)', transformOrigin: 'right' }}>
                {isThemeSwitch ? (
                    <ThemeSwitch checked={enabled} onChange={onToggle} />
                ) : (
                    <UiverseSwitch checked={enabled} onChange={onToggle} />
                )}
            </div>
        </motion.div>
    );
};

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [eyeProtectionEnabled, setEyeProtectionEnabled] = useState(false);
    const [darkModeEnabled, setDarkModeEnabled] = useState(false);

    const reduce = useReducedMotion();
    const enterY = reduce ? 0 : 20;
    const enterScale = reduce ? 1 : 0.97;

    // Check for dark mode on mount and listen for changes
    useEffect(() => {
        const checkDarkMode = () => {
            setDarkModeEnabled(document.body.classList.contains('dark-mode'));
        };
        checkDarkMode();
        
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const savedSound = localStorage.getItem('soundEnabled');
        if (savedSound !== null) setSoundEnabled(savedSound === 'true');

        const savedEyeProtection = localStorage.getItem('eyeProtectionEnabled');
        if (savedEyeProtection !== null) {
            const isEnabled = savedEyeProtection === 'true';
            setEyeProtectionEnabled(isEnabled);
            if (isEnabled) document.body.classList.add('eye-protection-mode');
        }

        const savedDarkMode = localStorage.getItem('darkModeEnabled');
        if (savedDarkMode !== null) {
            const isEnabled = savedDarkMode === 'true';
            setDarkModeEnabled(isEnabled);
            if (isEnabled) document.body.classList.add('dark-mode');
        }
    }, []);

    // Lock body scroll when modal is open to prevent iOS Safari from swallowing touch events as scroll intents
    useEffect(() => {
        if (!isOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [isOpen]);



    const playSound = () => {
        if (!soundEnabled) return;
        const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.08);
    };

    const toggleSound = () => {
        const newVal = !soundEnabled;
        setSoundEnabled(newVal);
        localStorage.setItem('soundEnabled', String(newVal));
        if (newVal) playSound();
    };

    const toggleEyeProtection = () => {
        const newVal = !eyeProtectionEnabled;
        setEyeProtectionEnabled(newVal);
        localStorage.setItem('eyeProtectionEnabled', String(newVal));
        document.body.classList.toggle('eye-protection-mode', newVal);
        playSound();
    };

    const toggleDarkMode = () => {
        const newVal = !darkModeEnabled;
        setDarkModeEnabled(newVal);
        localStorage.setItem('darkModeEnabled', String(newVal));
        document.body.classList.toggle('dark-mode', newVal);
        playSound();
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
            aria-hidden={!isOpen}
            className={`fixed inset-0 z-[999999] ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        >
            <motion.div
                initial={false}
                animate={{ opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                onClick={onClose}
                className={`absolute inset-0 ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
                style={{
                    backgroundColor: darkModeEnabled ? 'rgba(0, 0, 0, 0.6)' : 'rgba(15, 23, 42, 0.4)',
                    backdropFilter: 'blur(4px)',
                }}
            />
            <div className="pointer-events-none absolute inset-0 flex justify-center items-center px-4 sm:px-6">
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            key="panel"
                        layout
                        initial={{ opacity: 0, y: enterY, scale: enterScale }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{
                            opacity: 0,
                            y: enterY,
                            scale: reduce ? 1 : 0.98,
                            transition: { duration: 0.18, ease: [0.32, 0.72, 0, 1] },
                        }}
                        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                        
                        className={`pointer-events-auto w-full max-w-[420px] rounded-[24px] overflow-hidden relative shadow-2xl border will-change-transform ${
                            darkModeEnabled ? 'bg-zinc-950 border-zinc-800/80 shadow-zinc-900/50' : 'bg-white border-zinc-200/80'
                        }`}
                    >
                        <motion.div layout="position">
                            <AnimatePresence mode="popLayout" initial={false}>
                                <motion.div
                                    key="content"
                                    initial={
                                        reduce
                                            ? { opacity: 0 }
                                            : { opacity: 0, y: 8, filter: "blur(4px)" }
                                    }
                                    animate={
                                        reduce
                                            ? {
                                                opacity: 1,
                                                transition: { duration: 0.18, ease: [0.32, 0.72, 0, 1] },
                                            }
                                            : {
                                                opacity: 1,
                                                y: 0,
                                                filter: "blur(0px)",
                                                transition: { duration: 0.24, ease: [0.32, 0.72, 0, 1] },
                                            }
                                    }
                                    exit={
                                        reduce
                                            ? {
                                                opacity: 0,
                                                transition: { duration: 0.14, ease: [0.32, 0.72, 0, 1] },
                                            }
                                            : {
                                                opacity: 0,
                                                y: -8,
                                                filter: "blur(4px)",
                                                transition: { duration: 0.16, ease: [0.32, 0.72, 0, 1] },
                                            }
                                    }
                                    onAnimationComplete={(definition) => {
                                        // Workaround for iOS Safari bug with CSS filters
                                        // Once animation enters (opacity: 1), we remove the filter completely
                                        const el = document.getElementById('settings-content-wrapper');
                                        if (el && (definition as any).opacity === 1) {
                                            el.style.filter = 'none';
                                        }
                                    }}
                                    id="settings-content-wrapper"
                                    className="pointer-events-auto"
                                >
                        {/* SaaS Background Accents */}
                        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
                        
                        {/* Header */}
                        <div className="p-6 pb-4 relative z-10">
                            <motion.button
                                onClick={onClose}
                                onPointerDown={(e) => { e.stopPropagation(); onClose(); }}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className={`absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-xl border shadow-sm transition-colors ${
                                    darkModeEnabled 
                                        ? 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700' 
                                        : 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50'
                                }`}
                                aria-label="Close Settings"
                            >
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </motion.button>
                            
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="flex gap-4 pr-8"
                            >
                                {/* Bouncy Wrench-style Settings Icon Container */}
                                <motion.div
                                    whileHover={{ scale: 1.05, rotate: -5 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                    className={`w-[52px] h-[52px] rounded-[16px] flex items-center justify-center flex-shrink-0 shadow-sm border ${
                                        darkModeEnabled ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'
                                    }`}
                                >
                                    <svg className={`w-6 h-6 ${darkModeEnabled ? 'text-blue-400' : 'text-blue-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                        <circle cx="12" cy="12" r="3" />
                                        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                                    </svg>
                                </motion.div>

                                {/* Text Info */}
                                <div className="flex-1 min-w-0 pt-0.5">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className={`text-[20px] font-bold tracking-tight leading-none ${
                                            darkModeEnabled ? 'text-zinc-100' : 'text-zinc-900'
                                        }`}>
                                            Preferences
                                        </h2>
                                    </div>
                                    <p className={`text-[12.5px] font-medium leading-[1.4] ${
                                        darkModeEnabled ? 'text-zinc-400' : 'text-zinc-500'
                                    }`}>
                                        Customize your learning experience
                                    </p>
                                </div>
                            </motion.div>
                        </div>

                        {/* Settings List */}
                        <div className="p-4 flex flex-col gap-1 relative z-10">
                            <SettingItem
                                icon={
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                        <path d="M11 5L6 9H2v6h4l5 4V5z" />
                                        <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
                                    </svg>
                                }
                                title="Sound Effects"
                                description="Audio feedback for interactions"
                                enabled={soundEnabled}
                                onToggle={toggleSound}
                                delay={0.15}
                                isDark={darkModeEnabled}
                            />
                            <SettingItem
                                icon={
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                }
                                title="Eye Protection"
                                description="Reduce blue light for less eye strain"
                                enabled={eyeProtectionEnabled}
                                onToggle={toggleEyeProtection}
                                delay={0.2}
                                isDark={darkModeEnabled}
                            />
                            <SettingItem
                                icon={
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                                    </svg>
                                }
                                title="Dark Mode"
                                description="Switch to dark color scheme"
                                enabled={darkModeEnabled}
                                onToggle={toggleDarkMode}
                                delay={0.25}
                                isDark={darkModeEnabled}
                                isThemeSwitch={true}
                            />
                        </div>

                        {/* Footer */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className={`p-4 flex justify-center border-t relative z-10 ${
                                darkModeEnabled ? 'border-zinc-800/80' : 'border-zinc-200/80'
                            }`}
                        >
                            <motion.div 
                                whileHover={{ scale: 1.02 }}
                                className={`flex w-full items-center justify-center gap-3 px-4 py-3 rounded-[14px] border shadow-sm transition-colors ${
                                    darkModeEnabled ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200/80'
                                }`}
                            >
                                <div className={`p-1.5 rounded-xl border flex-shrink-0 ${
                                    darkModeEnabled 
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                        : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                }`}>
                                    <svg className="w-[16px] h-[16px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 6L9 17l-5-5" />
                                    </svg>
                                </div>
                                <div className="flex flex-col justify-center gap-0.5">
                                    <span className={`text-[9px] font-bold uppercase tracking-widest leading-none ${
                                        darkModeEnabled ? 'text-zinc-500' : 'text-zinc-400'
                                    }`}>
                                        Status
                                    </span>
                                    <span className={`text-[12px] font-bold leading-none ${
                                        darkModeEnabled ? 'text-zinc-100' : 'text-zinc-900'
                                    }`}>
                                        Saved automatically
                                    </span>
                                </div>
                            </motion.div>
                        </motion.div>
                                </motion.div>
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </div>,
    document.body
);
};

export default SettingsModal;
