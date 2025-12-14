/**
 * Getting Started Modal - Minimalistic Design
 * Clean onboarding with animated progress bar
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';

interface GettingStartedModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Step {
    id: string;
    title: string;
    description: string;
    tip: string;
    icon: React.ReactNode;
    image: string;
}

const BLUE = '#3b82f6';

const steps: Step[] = [
    {
        id: 'dashboard',
        title: 'Your Dashboard',
        description: 'Your central hub for tracking courses, deadlines, study time, and grade predictions.',
        tip: 'Check your dashboard daily to stay on top of your academic progress.',
        image: 'https://placehold.co/360x160/3b82f6/ffffff?text=Dashboard+Preview',
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
        ),
    },
    {
        id: 'courses',
        title: 'Your Courses',
        description: 'Access all enrolled courses, upload materials, and track your learning progress.',
        tip: 'Organize your courses by semester for easier navigation.',
        image: 'https://placehold.co/360x160/2563eb/ffffff?text=Courses+Preview',
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
        ),
    },
    {
        id: 'tools',
        title: 'Productivity Tools',
        description: 'Use AI-powered tools like Grammar Checker, Citation Generator, and Paraphraser.',
        tip: 'The Grammar Checker can help improve your writing before submission.',
        image: 'https://placehold.co/360x160/1d4ed8/ffffff?text=Tools+Preview',
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
        ),
    },
    {
        id: 'progress',
        title: 'Track Progress',
        description: 'Monitor study streaks, earn achievements, and view AI-powered grade predictions.',
        tip: 'Maintain your daily streak to build consistent study habits.',
        image: 'https://placehold.co/360x160/1e40af/ffffff?text=Progress+Preview',
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
        ),
    },
    {
        id: 'settings',
        title: 'Personalize',
        description: 'Customize your experience with dark mode, notifications, and profile settings.',
        tip: 'Enable dark mode for comfortable studying at night.',
        image: 'https://placehold.co/360x160/1e3a8a/ffffff?text=Settings+Preview',
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
        ),
    },
];

// Animated Lightbulb Icon Component
const LightbulbIcon: React.FC = () => (
    <motion.svg 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="#3b82f6" 
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <motion.path 
            d="M9 18h6"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
        />
        <motion.path 
            d="M10 22h4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
        />
        <motion.path 
            d="M12 2v1"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.2 }}
        />
        <motion.path 
            d="M4.93 4.93l.71.71"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
        />
        <motion.path 
            d="M2 12h1"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.2, delay: 0.15 }}
        />
        <motion.path 
            d="M21 12h1"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.2, delay: 0.15 }}
        />
        <motion.path 
            d="M19.07 4.93l-.71.71"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
        />
        <motion.path 
            d="M15.54 8.46a5 5 0 1 0-7.08 7.08L9 16h6l.54-.54a5 5 0 0 0 0-7.08z"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
        />
    </motion.svg>
);


const GettingStartedModal: React.FC<GettingStartedModalProps> = ({ isOpen, onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isDarkMode, setIsDarkMode] = useState(() => 
        document.body.classList.contains('dark-mode')
    );

    useEffect(() => {
        const checkDarkMode = () => setIsDarkMode(document.body.classList.contains('dark-mode'));
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (isOpen) setCurrentStep(0);
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight' && currentStep < steps.length - 1) setCurrentStep(c => c + 1);
            if (e.key === 'ArrowLeft' && currentStep > 0) setCurrentStep(c => c - 1);
        };
        if (isOpen) document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, currentStep, onClose]);

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const step = steps[currentStep];
    const progress = ((currentStep + 1) / steps.length) * 100;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 99998,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                }}>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
                            backdropFilter: 'blur(8px)',
                        }}
                    />


                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                        style={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: '480px',
                            background: isDarkMode ? '#1e293b' : '#ffffff',
                            borderRadius: '20px',
                            boxShadow: isDarkMode 
                                ? '0 25px 60px rgba(0, 0, 0, 0.5)' 
                                : '0 25px 60px rgba(0, 0, 0, 0.15)',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Progress bar */}
                        <div style={{
                            height: '4px',
                            background: isDarkMode ? '#334155' : '#e2e8f0',
                            position: 'relative',
                            overflow: 'hidden',
                        }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                                style={{
                                    height: '100%',
                                    background: BLUE,
                                    borderRadius: '0 2px 2px 0',
                                }}
                            />
                        </div>

                        {/* Close button */}
                        <motion.button
                            onClick={onClose}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                border: 'none',
                                background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isDarkMode ? '#94a3b8' : '#64748b',
                                zIndex: 10,
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </motion.button>


                        {/* Content */}
                        <div style={{ padding: '40px 32px 32px' }}>
                            {/* Step indicator */}
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{
                                    margin: '0 0 24px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: BLUE,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                    textAlign: 'center',
                                }}
                            >
                                Step {currentStep + 1} of {steps.length}
                            </motion.p>

                            {/* Step content */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={step.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                    style={{ textAlign: 'center' }}
                                >
                                    {/* Image placeholder */}
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ type: 'spring', delay: 0.05 }}
                                        style={{
                                            width: '100%',
                                            height: '140px',
                                            marginBottom: '20px',
                                            borderRadius: '12px',
                                            overflow: 'hidden',
                                            background: isDarkMode ? '#0f172a' : '#f1f5f9',
                                            border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'}`,
                                            position: 'relative',
                                        }}
                                    >
                                        <img
                                            src={step.image}
                                            alt={step.title}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                            }}
                                        />
                                    </motion.div>

                                    {/* Icon + Title row */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '12px' }}>
                                        <motion.div
                                            initial={{ scale: 0, rotate: -180 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: 'spring', delay: 0.1 }}
                                            style={{
                                                width: '44px',
                                                height: '44px',
                                                borderRadius: '12px',
                                                background: isDarkMode ? `${BLUE}15` : `${BLUE}10`,
                                                border: `1px solid ${isDarkMode ? `${BLUE}30` : `${BLUE}20`}`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: BLUE,
                                                flexShrink: 0,
                                            }}
                                        >
                                            {step.icon}
                                        </motion.div>
                                        <h2 style={{
                                            margin: 0,
                                            fontSize: '22px',
                                            fontWeight: 700,
                                            color: isDarkMode ? '#f1f5f9' : '#0f172a',
                                        }}>
                                            {step.title}
                                        </h2>
                                    </div>

                                    {/* Description */}
                                    <p style={{
                                        margin: '0 0 16px',
                                        fontSize: '14px',
                                        lineHeight: 1.6,
                                        color: isDarkMode ? '#94a3b8' : '#64748b',
                                    }}>
                                        {step.description}
                                    </p>

                                    {/* Tip with animated lightbulb */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.25 }}
                                        style={{
                                            padding: '10px 14px',
                                            borderRadius: '10px',
                                            background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                                            border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'}`,
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: 'spring', delay: 0.3 }}
                                                style={{
                                                    width: '28px',
                                                    height: '28px',
                                                    borderRadius: '8px',
                                                    background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <LightbulbIcon />
                                            </motion.div>
                                            <span style={{
                                                fontSize: '13px',
                                                color: isDarkMode ? '#60a5fa' : BLUE,
                                                fontWeight: 500,
                                                textAlign: 'left',
                                            }}>
                                                {step.tip}
                                            </span>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            </AnimatePresence>
                        </div>


                        {/* Footer */}
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            padding: '0 32px 32px',
                        }}>
                            <motion.button
                                onClick={() => currentStep > 0 ? setCurrentStep(c => c - 1) : onClose()}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    borderRadius: '12px',
                                    border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                                    background: 'transparent',
                                    color: isDarkMode ? '#94a3b8' : '#64748b',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                {currentStep === 0 ? 'Skip' : 'Back'}
                            </motion.button>
                            <motion.button
                                onClick={() => currentStep < steps.length - 1 ? setCurrentStep(c => c + 1) : onClose()}
                                whileHover={{ scale: 1.02, boxShadow: `0 8px 24px ${BLUE}40` }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: BLUE,
                                    color: '#ffffff',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    boxShadow: `0 4px 12px ${BLUE}30`,
                                }}
                            >
                                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default GettingStartedModal;