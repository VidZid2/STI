/**
 * Voice Note Modal Component
 * Allows users to record and share voice notes in the chat
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import type { ModalColors } from './types';
import { formatDuration } from '../utils';

interface VoiceNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (duration: string, transcript: string) => void;
    colors: ModalColors;
}

export const VoiceNoteModal: React.FC<VoiceNoteModalProps> = ({ isOpen, onClose, onSend, colors }) => {
    const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'recorded' | 'playing'>('idle');
    const [duration, setDuration] = useState(0);
    const [playbackPosition, setPlaybackPosition] = useState(0);
    const [transcript, setTranscript] = useState('');
    const [waveformBars, setWaveformBars] = useState<number[]>(Array(32).fill(0.1));
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [permissionError, setPermissionError] = useState<string | null>(null);
    
    // Audio refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const audioElementRef = useRef<HTMLAudioElement | null>(null);
    const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
    
    const isDarkMode = colors.cardBg !== '#ffffff';
    const accentColor = '#3b82f6';
    const isRecordingRef = useRef(false);

    // Start recording with real microphone
    const startRecording = async () => {
        try {
            setPermissionError(null);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            audioContextRef.current = audioContext;
            
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.7;
            source.connect(analyser);
            analyserRef.current = analyser;
            
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(audioBlob);
                setAudioUrl(url);
            };
            
            mediaRecorder.start(100);
            setRecordingState('recording');
            isRecordingRef.current = true;
            setDuration(0);
            setPlaybackPosition(0);
            
            durationIntervalRef.current = setInterval(() => {
                setDuration(d => d + 1);
            }, 1000);
            
            const startAnalysis = () => {
                if (!analyserRef.current || !isRecordingRef.current) return;
                
                const analyser = analyserRef.current;
                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(dataArray);
                
                const bars: number[] = [];
                const binCount = analyser.frequencyBinCount;
                for (let i = 0; i < 32; i++) {
                    const startBin = Math.floor((i / 32) * binCount * 0.5);
                    const endBin = Math.floor(((i + 1) / 32) * binCount * 0.5);
                    let sum = 0;
                    for (let j = startBin; j < endBin; j++) {
                        sum += dataArray[j];
                    }
                    const avg = sum / Math.max(1, endBin - startBin);
                    const normalized = avg / 255;
                    bars.push(Math.min(1, Math.max(0.08, normalized * 1.8)));
                }
                setWaveformBars(bars);
                
                if (isRecordingRef.current) {
                    animationFrameRef.current = requestAnimationFrame(startAnalysis);
                }
            };
            
            animationFrameRef.current = requestAnimationFrame(startAnalysis);
            
        } catch (error: unknown) {
            console.error('Error accessing microphone:', error);
            const err = error as { name?: string };
            if (err.name === 'NotAllowedError') {
                setPermissionError('Microphone access denied. Please allow microphone access to record.');
            } else if (err.name === 'NotFoundError') {
                setPermissionError('No microphone found. Please connect a microphone.');
            } else {
                setPermissionError('Could not access microphone. Please try again.');
            }
        }
    };

    const stopRecording = () => {
        isRecordingRef.current = false;
        
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
        
        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
        }
        
        setWaveformBars(prev => prev.map((v) => Math.max(0.15, v * 0.8)));
        setRecordingState('recorded');
    };

    const playRecording = () => {
        if (!audioUrl) return;
        
        const audio = new Audio(audioUrl);
        audioElementRef.current = audio;
        
        audio.onended = () => {
            setRecordingState('recorded');
            setPlaybackPosition(0);
            if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
        };
        
        audio.play();
        setRecordingState('playing');
        setPlaybackPosition(0);
        
        playbackIntervalRef.current = setInterval(() => {
            setPlaybackPosition(p => Math.min(p + 1, duration));
        }, 1000);
    };

    const pausePlayback = () => {
        if (audioElementRef.current) {
            audioElementRef.current.pause();
        }
        if (playbackIntervalRef.current) {
            clearInterval(playbackIntervalRef.current);
        }
        setRecordingState('recorded');
    };

    const resetRecording = () => {
        isRecordingRef.current = false;
        
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (audioElementRef.current) {
            audioElementRef.current.pause();
            audioElementRef.current = null;
        }
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        setAudioUrl(null);
        setRecordingState('idle');
        setDuration(0);
        setPlaybackPosition(0);
        setWaveformBars(Array(32).fill(0.1));
        setPermissionError(null);
        audioChunksRef.current = [];
    };

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
            }
            if (playbackIntervalRef.current) {
                clearInterval(playbackIntervalRef.current);
            }
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, [audioUrl]);

    if (!isOpen) return null;


    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)', zIndex: 1001,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: colors.cardBg, 
                    borderRadius: '16px', 
                    width: '100%', 
                    maxWidth: '340px', 
                    boxShadow: isDarkMode 
                        ? '0 20px 40px rgba(0,0,0,0.4)' 
                        : '0 20px 40px rgba(0,0,0,0.12)',
                    border: `1px solid ${colors.border}`,
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderBottom: `1px solid ${colors.border}`,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '8px',
                            background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
                            </svg>
                        </div>
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: colors.textPrimary }}>
                            Voice Note
                        </h3>
                    </div>
                    <motion.button
                        whileHover={{ background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onClose}
                        style={{
                            width: 28, height: 28, borderRadius: '8px', border: 'none',
                            background: 'transparent', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: colors.textMuted,
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </motion.button>
                </div>

                {/* Recording Visualization */}
                <div style={{ padding: '20px 16px' }}>
                    {permissionError && (
                        <div style={{
                            padding: '12px', borderRadius: '10px',
                            background: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px',
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 500 }}>
                                {permissionError}
                            </span>
                        </div>
                    )}

                    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                        <p style={{ 
                            fontSize: '42px', fontWeight: 300, 
                            color: recordingState === 'recording' ? accentColor : colors.textPrimary, 
                            margin: '0', fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px',
                        }}>
                            {recordingState === 'playing' ? formatDuration(playbackPosition) : formatDuration(duration)}
                        </p>
                    </div>

                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '2px', height: '56px', marginBottom: '12px', padding: '0 8px',
                    }}>
                        {waveformBars.map((height, i) => {
                            const isPlayed = recordingState === 'playing' && (i / waveformBars.length) <= (playbackPosition / duration);
                            return (
                                <div
                                    key={i}
                                    style={{
                                        width: '4px',
                                        height: recordingState === 'recording' 
                                            ? `${Math.max(10, height * 100)}%` 
                                            : recordingState === 'idle' ? '10%' : `${Math.max(10, height * 100)}%`,
                                        borderRadius: '2px',
                                        background: recordingState === 'recording' ? accentColor
                                            : isPlayed ? accentColor
                                            : isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                                        transition: recordingState === 'recording' ? 'none' : 'height 0.1s ease, background 0.15s ease',
                                    }}
                                />
                            );
                        })}
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0, fontWeight: 500 }}>
                            {recordingState === 'idle' && !permissionError && 'Tap to start recording'}
                            {recordingState === 'idle' && permissionError && 'Fix the error above to record'}
                            {recordingState === 'recording' && (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: accentColor }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: accentColor, animation: 'pulse 1.5s ease-in-out infinite' }} />
                                    Recording
                                </span>
                            )}
                            {recordingState === 'recorded' && 'Recording complete'}
                            {recordingState === 'playing' && 'Playing back'}
                        </p>
                    </div>
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '0 16px 16px' }}>
                    {(recordingState === 'recorded' || recordingState === 'playing') && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ background: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={resetRecording}
                            style={{
                                width: 40, height: 40, borderRadius: '10px', border: 'none',
                                background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444',
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                        </motion.button>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={recordingState === 'recording' ? stopRecording : recordingState === 'idle' ? startRecording : undefined}
                        disabled={recordingState === 'recorded' || recordingState === 'playing'}
                        style={{
                            width: 56, height: 56, borderRadius: '50%', border: 'none',
                            background: recordingState === 'recording' ? '#ef4444'
                                : recordingState === 'idle' ? accentColor
                                : isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                            cursor: recordingState === 'recorded' || recordingState === 'playing' ? 'default' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: recordingState === 'recording' ? '0 0 0 4px rgba(239, 68, 68, 0.2)' 
                                : recordingState === 'idle' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
                        }}
                    >
                        {recordingState === 'recording' ? (
                            <div style={{ width: 16, height: 16, borderRadius: '3px', background: '#fff' }} />
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
                            </svg>
                        )}
                    </motion.button>

                    {(recordingState === 'recorded' || recordingState === 'playing') && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={recordingState === 'playing' ? pausePlayback : playRecording}
                            style={{
                                width: 40, height: 40, borderRadius: '10px', border: 'none',
                                background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor,
                            }}
                        >
                            {recordingState === 'playing' ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <rect x="6" y="4" width="4" height="16" rx="1" />
                                    <rect x="14" y="4" width="4" height="16" rx="1" />
                                </svg>
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                            )}
                        </motion.button>
                    )}
                </div>

                {/* Transcript Input */}
                <div style={{ padding: '0 16px 12px', borderTop: `1px solid ${colors.border}`, paddingTop: '12px' }}>
                    <textarea
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        placeholder="Add a note (optional)..."
                        style={{
                            width: '100%', padding: '10px 12px', borderRadius: '10px',
                            border: `1px solid ${colors.border}`, 
                            background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
                            fontSize: '13px', resize: 'none', outline: 'none', 
                            minHeight: '44px', maxHeight: '80px',
                            color: colors.textPrimary, fontFamily: 'inherit',
                        }}
                        onFocus={(e) => e.target.style.borderColor = accentColor}
                        onBlur={(e) => e.target.style.borderColor = colors.border}
                    />
                </div>

                {/* Footer */}
                <div style={{ 
                    display: 'flex', gap: '8px', padding: '12px 16px',
                    borderTop: `1px solid ${colors.border}`,
                    background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
                }}>
                    <motion.button
                        whileHover={{ background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onClose}
                        style={{
                            flex: 1, padding: '10px 16px', borderRadius: '10px', border: 'none',
                            background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                            cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: colors.textSecondary,
                        }}
                    >
                        Cancel
                    </motion.button>
                    <motion.button
                        whileHover={duration > 0 && recordingState !== 'recording' ? { background: '#2563eb' } : {}}
                        whileTap={duration > 0 && recordingState !== 'recording' ? { scale: 0.98 } : {}}
                        onClick={() => { 
                            if (duration > 0 && recordingState !== 'recording') {
                                onSend(formatDuration(duration), transcript); 
                                resetRecording();
                                setTranscript(''); 
                                onClose(); 
                            }
                        }}
                        disabled={duration === 0 || recordingState === 'recording'}
                        style={{
                            flex: 1, padding: '10px 16px', borderRadius: '10px', border: 'none',
                            background: duration > 0 && recordingState !== 'recording' ? accentColor
                                : isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                            cursor: duration > 0 && recordingState !== 'recording' ? 'pointer' : 'not-allowed',
                            fontSize: '13px', fontWeight: 500,
                            color: duration > 0 && recordingState !== 'recording' ? '#fff' : colors.textMuted,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                        Send
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
};
