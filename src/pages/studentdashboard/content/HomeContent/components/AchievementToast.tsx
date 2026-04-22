/**
 * AchievementToast
 * Bottom-left achievement notification toast.
 * Extracted from HomeContent.tsx during Phase 8.8
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';

// Achievement Toast Component - Bottom Left Position (rendered via portal to escape overflow)
const AchievementToast: React.FC<{
    show: boolean;
    title: string;
    description: string;
    icon: string;
    onClose: () => void;
}> = ({ show, title, description, icon, onClose }) => {
    // Use portal to render outside the component tree
    const toastContent = (
        <AnimatePresence>
            {show && (
                <motion.div
                    className="achievement-toast"
                    style={{
                        position: 'fixed',
                        bottom: '20px',
                        left: '20px',
                        top: 'auto',
                        right: 'auto',
                        zIndex: 99998, // Below custom cursor (99999)
                        maxWidth: '320px',
                    }}
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 30, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                <motion.div 
                    className="achievement-icon"
                    initial={{ rotate: -20, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
                >
                    {icon}
                </motion.div>
                <div className="achievement-content">
                    <motion.span 
                        className="achievement-label"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        Achievement Unlocked!
                    </motion.span>
                    <motion.h4 
                        className="achievement-title"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 }}
                    >
                        {title}
                    </motion.h4>
                    <motion.p 
                        className="achievement-desc"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        {description}
                    </motion.p>
                </div>
                <motion.button
                    className="achievement-close"
                    onClick={onClose}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    ✕
                </motion.button>
                    <motion.div
                        className="achievement-progress"
                        initial={{ scaleX: 1 }}
                        animate={{ scaleX: 0 }}
                        transition={{ duration: 5, ease: 'linear' }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
    
    // Render via portal to document.body to escape any overflow:hidden containers
    return typeof document !== 'undefined' ? createPortal(toastContent, document.body) : null;
};


export { AchievementToast };
