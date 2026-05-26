/**
 * AmbientSounds + SoundIcon
 * Ambient sound player controls.
 * Extracted from FocusModePage.tsx during Phase 8.5
 * Refactored in Phase 9.5 (Styling Consistency)
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { FocusModeColors } from '../FocusModePage';

// Ambient Sounds Data
const AMBIENT_SOUNDS = [
    { id: 'lofi', label: 'Lo-Fi', icon: 'lofi', url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3', color: '#8b5cf6' },
    { id: 'rain', label: 'Rain', icon: 'rain', url: 'https://cdn.pixabay.com/audio/2021/08/09/audio_8dd9f1a21e.mp3', color: '#3b82f6' },
    { id: 'cafe', label: 'Cafe', icon: 'cafe', url: 'https://cdn.pixabay.com/audio/2021/08/09/audio_f5b5c92c90.mp3', color: '#f59e0b' },
    { id: 'nature', label: 'Nature', icon: 'nature', url: 'https://cdn.pixabay.com/audio/2021/09/06/audio_2491a5db4e.mp3', color: '#10b981' },
    { id: 'fire', label: 'Fire', icon: 'fire', url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_b2f2bf29a6.mp3', color: '#ef4444' },
    { id: 'waves', label: 'Waves', icon: 'waves', url: 'https://cdn.pixabay.com/audio/2021/08/09/audio_f04a6042db.mp3', color: '#0ea5e9' },
];

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
        ) };
    return <>{icons[id] || icons.lofi}</>;
};


// Ambient Sounds Component
const AmbientSounds: React.FC<{
    isDarkMode: boolean;
    colors: FocusModeColors;
    activeSound?: string | null;
    onSoundChange?: (soundId: string | null) => void;
}> = ({ isDarkMode: _isDarkMode, colors: _colors, activeSound: externalActiveSound, onSoundChange }) => {
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
                audio.play().catch(e => console.error("Audio playback failed:", e));
                audioRef.current = audio;
            }

            setActiveSound(soundId);
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
            className="dashboard-card"
            style={{ padding: '16px' }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '14px' }}>
                <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '10px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--brand-blue)' }}>
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
                        color: 'var(--text-primary)' }}>
                        Ambient Sounds
                    </div>
                    <div style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)' }}>
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
                            background: 'var(--success)',
                            boxShadow: '0 0 8px var(--success)' }}
                    />
                )}
            </div>

            {/* Sound Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                marginBottom: activeSound ? '16px' : '0' }}>
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
                                    : `1px solid var(--border-light)`,
                                background: isActive
                                    ? `${sound.color}10`
                                    : 'var(--bg-hover)',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s ease' }}
                        >
                            <div style={{
                                color: isActive ? sound.color : 'var(--text-muted)',
                                transition: 'color 0.2s ease' }}>
                                <SoundIcon id={sound.icon} color="currentColor" />
                            </div>
                            <span style={{
                                fontSize: '10px',
                                fontWeight: isActive ? 600 : 500,
                                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                {sound.label}
                            </span>
                        </motion.button>
                    );
                })}
            </div>

            {/* Volume Control (Only show when playing) */}
            <AnimatePresence>
                {activeSound && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            paddingTop: '12px',
                            borderTop: '1px solid var(--border-light)' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            </svg>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={volume}
                                onChange={(e) => setVolume(parseInt(e.target.value))}
                                style={{
                                    flex: 1,
                                    height: '4px',
                                    borderRadius: '2px',
                                    appearance: 'none',
                                    background: 'var(--bg-hover)',
                                    cursor: 'pointer' }}
                            />
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                            </svg>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export { AmbientSounds };
