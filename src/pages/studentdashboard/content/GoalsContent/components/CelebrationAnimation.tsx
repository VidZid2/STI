/**
 * CelebrationAnimation
 * Confetti/celebration overlay when a goal is completed.
 * Extracted from GoalsContent.tsx during Phase 8.3
 */
import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Celebration Animation Component - Minimalistic Blue Theme
const CelebrationAnimation: React.FC<{
    isVisible: boolean;
    onComplete: () => void;
    goalTitle?: string;
}> = ({ isVisible, onComplete, goalTitle }) => {
    const blueAccent = '#3b82f6';
    const blueBg = 'rgba(59, 130, 246, 0.08)';
    const blueBorder = 'rgba(59, 130, 246, 0.15)';
    
    // Subtle confetti particles - blue theme
    const particles = useMemo(() => {
        const colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#2563eb', '#1d4ed8'];
        return Array.from({ length: 30 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            delay: Math.random() * 0.3,
            duration: 2.5 + Math.random() * 1,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 4 + Math.random() * 6,
            rotation: Math.random() * 360,
            type: Math.random() > 0.6 ? 'circle' : 'rect',
        }));
    }, []);

    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(onComplete, 4000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onComplete]);

    return createPortal(
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={onComplete}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.4)',
                        backdropFilter: 'blur(8px)',
                        zIndex: 10001,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                    }}
                >
                    {/* Subtle confetti */}
                    {particles.map((particle) => (
                        <motion.div
                            key={particle.id}
                            initial={{ 
                                x: `${particle.x}vw`,
                                y: '-5vh',
                                rotate: 0,
                                opacity: 0.8,
                            }}
                            animate={{ 
                                y: '105vh',
                                rotate: particle.rotation + 540,
                                opacity: [0.8, 0.6, 0],
                            }}
                            transition={{
                                duration: particle.duration,
                                delay: particle.delay,
                                ease: 'easeOut',
                            }}
                            style={{
                                position: 'absolute',
                                width: particle.size,
                                height: particle.type === 'rect' ? particle.size * 0.5 : particle.size,
                                background: particle.color,
                                borderRadius: particle.type === 'circle' ? '50%' : '1px',
                                pointerEvents: 'none',
                            }}
                        />
                    ))}

                    {/* Center card */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: '#ffffff',
                            borderRadius: '20px',
                            padding: '32px 40px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '20px',
                            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.04)',
                            maxWidth: '340px',
                            textAlign: 'center',
                        }}
                    >
                        {/* Icon */}
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 25 }}
                            style={{
                                width: 72,
                                height: 72,
                                borderRadius: '18px',
                                background: `linear-gradient(135deg, ${blueAccent} 0%, #2563eb 100%)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 8px 24px rgba(59, 130, 246, 0.35)',
                            }}
                        >
                            <motion.div
                                animate={{ 
                                    scale: [1, 1.1, 1],
                                }}
                                transition={{ 
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                            >
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            </motion.div>
                        </motion.div>

                        {/* Title */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                        >
                            <h3 style={{
                                margin: 0,
                                fontSize: '22px',
                                fontWeight: 700,
                                color: '#0f172a',
                                letterSpacing: '-0.02em',
                                marginBottom: '6px',
                            }}>
                                Goal Completed!
                            </h3>
                            {goalTitle && (
                                <p style={{
                                    margin: 0,
                                    fontSize: '14px',
                                    color: '#64748b',
                                    lineHeight: 1.5,
                                }}>
                                    {goalTitle}
                                </p>
                            )}
                        </motion.div>

                        {/* Progress indicator */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.35 }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 16px',
                                background: blueBg,
                                border: `1px solid ${blueBorder}`,
                                borderRadius: '12px',
                            }}
                        >
                            <div style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: '#10b981',
                            }} />
                            <span style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                color: blueAccent,
                            }}>
                                100% Complete
                            </span>
                        </motion.div>

                        {/* Dismiss button */}
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.45 }}
                            whileHover={{ scale: 1.02, boxShadow: '0 4px 16px rgba(59, 130, 246, 0.35)' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onComplete}
                            style={{
                                padding: '12px 28px',
                                borderRadius: '12px',
                                border: 'none',
                                background: `linear-gradient(135deg, ${blueAccent} 0%, #2563eb 100%)`,
                                color: '#fff',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)',
                                marginTop: '4px',
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                            Dismiss
                        </motion.button>

                        {/* Subtle ring animation */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: [1, 1.3, 1.5], opacity: [0.3, 0.1, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                            style={{
                                position: 'absolute',
                                width: 100,
                                height: 100,
                                borderRadius: '50%',
                                border: `2px solid ${blueAccent}`,
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -80%)',
                                pointerEvents: 'none',
                            }}
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};


export { CelebrationAnimation };
