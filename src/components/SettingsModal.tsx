import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

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
}

const SettingItem: React.FC<SettingItemProps> = ({ icon, title, description, enabled, onToggle, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
        onClick={onToggle}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '16px 20px',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease',
        }}
    >
        <motion.div
            style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: enabled ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0, 0, 0, 0.04)',
                color: enabled ? '#3b82f6' : '#94a3b8',
                flexShrink: 0,
            }}
            animate={{ 
                backgroundColor: enabled ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0, 0, 0, 0.04)',
                color: enabled ? '#3b82f6' : '#94a3b8',
            }}
            transition={{ duration: 0.2 }}
        >
            {icon}
        </motion.div>
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', marginBottom: '2px' }}>
                {title}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                {description}
            </div>
        </div>

        {/* Toggle Switch */}
        <label 
            className="settings-switch" 
            onClick={(e) => e.stopPropagation()}
            style={{ flexShrink: 0 }}
        >
            <input 
                type="checkbox" 
                checked={enabled} 
                onChange={onToggle}
            />
            <div className="settings-slider">
                <div className="settings-circle">
                    <svg 
                        className="settings-cross" 
                        viewBox="0 0 365.696 365.696" 
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path 
                            fill="currentColor" 
                            d="M243.188 182.86 356.32 69.726c12.5-12.5 12.5-32.766 0-45.247L341.238 9.398c-12.504-12.503-32.77-12.503-45.25 0L182.86 122.528 69.727 9.374c-12.5-12.5-32.766-12.5-45.247 0L9.375 24.457c-12.5 12.504-12.5 32.77 0 45.25l113.152 113.152L9.398 295.99c-12.503 12.503-12.503 32.769 0 45.25L24.48 356.32c12.5 12.5 32.766 12.5 45.247 0l113.132-113.132L295.99 356.32c12.503 12.5 32.769 12.5 45.25 0l15.081-15.082c12.5-12.504 12.5-32.77 0-45.25zm0 0"
                        />
                    </svg>
                    <svg 
                        className="settings-checkmark" 
                        viewBox="0 0 24 24" 
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path 
                            fill="currentColor" 
                            d="M9.707 19.121a.997.997 0 0 1-1.414 0l-5.646-5.647a1.5 1.5 0 0 1 0-2.121l.707-.707a1.5 1.5 0 0 1 2.121 0L9 14.171l9.525-9.525a1.5 1.5 0 0 1 2.121 0l.707.707a1.5 1.5 0 0 1 0 2.121z"
                        />
                    </svg>
                </div>
            </div>
        </label>
    </motion.div>
);

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [eyeProtectionEnabled, setEyeProtectionEnabled] = useState(false);
    const [darkModeEnabled, setDarkModeEnabled] = useState(false);

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

    const playSound = () => {
        if (!soundEnabled) return;
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
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


    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.4)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: '20px',
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '100%',
                            maxWidth: '420px',
                            backgroundColor: '#fff',
                            borderRadius: '20px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Header */}
                        <div style={{ padding: '24px 24px 0', position: 'relative' }}>
                            <motion.button
                                onClick={onClose}
                                whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,0,0,0.06)' }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    position: 'absolute',
                                    top: '16px',
                                    right: '16px',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#94a3b8',
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </motion.button>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round">
                                        <circle cx="12" cy="12" r="3" />
                                        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                                    </svg>
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Settings
                                    </span>
                                </div>
                                <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                    Preferences
                                </h2>
                                <p style={{ fontSize: '13px', color: '#64748b', margin: '6px 0 0', lineHeight: 1.5 }}>
                                    Customize your learning experience
                                </p>
                            </motion.div>
                        </div>


                        {/* Settings List */}
                        <div style={{ padding: '20px 16px 24px' }}>
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
                            />
                        </div>

                        {/* Footer */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            style={{
                                padding: '12px 24px',
                                borderTop: '1px solid #f1f5f9',
                                display: 'flex',
                                justifyContent: 'center',
                            }}
                        >
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                Changes are saved automatically
                            </span>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SettingsModal;
