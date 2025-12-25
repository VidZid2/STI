import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const WelcomeNotification: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [progress, setProgress] = useState(100);
    const audioRef = useRef<HTMLAudioElement>(null);
    const timerRef = useRef<number | null>(null);
    const progressRef = useRef<number | null>(null);

    useEffect(() => {
        const introShown = sessionStorage.getItem('introShown');
        const delay = introShown === 'true' ? 800 : 8500;

        const showTimer = setTimeout(() => {
            setIsVisible(true);
            
            // Play sound
            if (audioRef.current) {
                audioRef.current.volume = 1.0;
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(e => console.log("Audio play failed", e));
            }

            // Start progress countdown
            const duration = 6000;
            const interval = 50;
            let elapsed = 0;
            
            progressRef.current = window.setInterval(() => {
                elapsed += interval;
                setProgress(Math.max(0, 100 - (elapsed / duration) * 100));
                
                if (elapsed >= duration) {
                    if (progressRef.current) clearInterval(progressRef.current);
                    setIsVisible(false);
                }
            }, interval);

        }, delay);

        timerRef.current = showTimer as unknown as number;

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (progressRef.current) clearInterval(progressRef.current);
        };
    }, []);

    const closeNotification = () => {
        if (progressRef.current) clearInterval(progressRef.current);
        setIsVisible(false);
    };

    return (
        <>
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        className="welcome-toast"
                        initial={{ opacity: 0, x: -20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -20, scale: 0.95 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            position: 'fixed',
                            top: '80px',
                            left: '20px',
                            zIndex: 10000,
                            background: '#ffffff',
                            borderRadius: '16px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04)',
                            overflow: 'hidden',
                            maxWidth: '360px',
                            width: 'calc(100% - 40px)',
                        }}
                    >
                        {/* Progress bar at top */}
                        <motion.div
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                height: '3px',
                                background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                                width: `${progress}%`,
                                borderRadius: '3px 0 0 0',
                            }}
                            transition={{ duration: 0.05 }}
                        />

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                            padding: '16px 16px 16px 18px',
                        }}>
                            {/* Icon */}
                            <motion.div
                                initial={{ scale: 0, rotate: -20 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                                style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '12px',
                                    background: '#eff6ff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                <img 
                                    src="images/Owl.png" 
                                    alt="STI Owl" 
                                    style={{ 
                                        width: '32px', 
                                        height: '32px', 
                                        objectFit: 'contain' 
                                    }} 
                                />
                            </motion.div>

                            {/* Content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <motion.p
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.2, delay: 0.15 }}
                                    style={{
                                        margin: 0,
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        color: '#111827',
                                        lineHeight: 1.3,
                                    }}
                                >
                                    Welcome to STI eLMS!
                                </motion.p>
                                <motion.p
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.2, delay: 0.2 }}
                                    style={{
                                        margin: '4px 0 0 0',
                                        fontSize: '12px',
                                        color: '#6b7280',
                                        lineHeight: 1.4,
                                    }}
                                >
                                    Your learning journey starts here
                                </motion.p>
                            </div>

                            {/* Close button */}
                            <motion.button
                                onClick={closeNotification}
                                whileHover={{ scale: 1.1, backgroundColor: '#f3f4f6' }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: 'transparent',
                                    color: '#9ca3af',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    transition: 'color 0.15s ease',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#6b7280'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <audio id="owl-sound" src="sounds/owl.mp3" preload="auto" ref={audioRef}></audio>
        </>
    );
};

export default WelcomeNotification;
