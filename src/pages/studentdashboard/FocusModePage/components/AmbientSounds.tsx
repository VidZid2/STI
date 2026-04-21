/**
 * AmbientSounds + SoundIcon
 * Ambient sound player controls.
 * Extracted from FocusModePage.tsx during Phase 8.5
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { FocusModeColors } from '../FocusModePage';

// Sound Icon Component
const SoundIcon: React.FC<{ id: string; color: string; size?: number }> = ({ id, color, size = 18 }) => {
    const icons: Record<string, React.ReactNode> = {
        lofi: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
            </svg>
        ),
        rain: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                <path d="M16 14v6" />
                <path d="M8 14v6" />
                <path d="M12 16v6" />
            </svg>
        ),
        cafe: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                <line x1="6" y1="2" x2="6" y2="4" />
                <line x1="10" y1="2" x2="10" y2="4" />
                <line x1="14" y1="2" x2="14" y2="4" />
            </svg>
        ),
        nature: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
        ),
        fire: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
        ),
        waves: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
                <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
                <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
            </svg>
        ),
    };
    return <>{icons[id] || icons.lofi}</>;
};


// Ambient Sounds Component
const AmbientSounds: React.FC<{
    isDarkMode: boolean;
    colors: FocusModeColors;
    activeSound?: string | null;
    onSoundChange?: (soundId: string | null) => void;
}> = ({ isDarkMode, colors, activeSound: externalActiveSound, onSoundChange }) => {
    const [internalActiveSound, setInternalActiveSound] = useState<string | null>(null);
    const [volume, setVolume] = useState(70);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const activeSound = externalActiveSound !== undefined ? externalActiveSound : internalActiveSound;
    const setActiveSound = onSoundChange || setInternalActiveSound;

    // Handle volume changes
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume / 100;
        }
    }, [volume]);

    const toggleSound = (soundId: string) => {
        if (activeSound === soundId) {
            // Stop current sound
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                audioRef.current = null;
            }
            setActiveSound(null);
        } else {
            // Stop previous sound
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }

            // Find the sound URL
            const sound = AMBIENT_SOUNDS.find(s => s.id === soundId);
            if (sound) {
                const audio = new Audio(sound.url);
                audio.loop = true;
                audio.volume = volume / 100;
                audio.play().catch(() => {});
                audioRef.current = audio;
                setActiveSound(soundId);
            }
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
            style={{
                padding: '16px',
                borderRadius: '14px',
                background: isDarkMode ? '#1e293b' : '#ffffff',
                border: `1px solid ${colors.border}`,
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '14px',
            }}>
                <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.06) 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3b82f6',
                }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    </svg>
                </div>
                <div>
                    <div style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: colors.textPrimary,
                    }}>
                        Ambient Sounds
                    </div>
                    <div style={{
                        fontSize: '11px',
                        color: colors.textMuted,
                    }}>
                        {activeSound ? 'Playing...' : 'Select to play'}
                    </div>
                </div>
                {activeSound && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={{
                            marginLeft: 'auto',
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: '#10b981',
                        }}
                    />
                )}
            </div>

            {/* Sound Grid - 3x2 layout */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
            }}>
                {AMBIENT_SOUNDS.map((sound) => {
                    const isActive = activeSound === sound.id;
                    return (
                        <motion.button
                            key={sound.id}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => toggleSound(sound.id)}
                            style={{
                                padding: '12px 8px',
                                borderRadius: '10px',
                                border: isActive
                                    ? `2px solid ${sound.color}40`
                                    : `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                                background: isActive
                                    ? `${sound.color}10`
                                    : (isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s ease',
                                boxShadow: isActive ? `0 4px 12px ${sound.color}20` : 'none',
                            }}
                        >
                            <SoundIcon id={sound.id} color={isActive ? sound.color : colors.textMuted} size={20} />
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: isActive ? sound.color : colors.textSecondary,
                            }}>
                                {sound.name}
                            </span>
                        </motion.button>
                    );
                })}
            </div>

            {/* Volume Slider */}
            <AnimatePresence>
                {activeSound && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ marginTop: '14px', overflow: 'hidden' }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            </svg>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={volume}
                                onChange={(e) => setVolume(Number(e.target.value))}
                                className="focus-volume-slider"
                                style={{
                                    flex: 1,
                                    height: '6px',
                                    borderRadius: '3px',
                                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume}%, ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} ${volume}%, ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} 100%)`,
                                }}
                            />
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: colors.textMuted,
                                minWidth: '28px',
                                textAlign: 'right',
                            }}>
                                {volume}%
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};


export { AmbientSounds };
