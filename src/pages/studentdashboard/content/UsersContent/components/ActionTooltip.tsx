import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const ActionTooltip: React.FC<{
    label: string;
    children: React.ReactNode;
}> = ({ label, children }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            style={{ position: 'relative', display: 'inline-flex' }}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <div style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        marginBottom: '6px',
                        zIndex: 100,
                        pointerEvents: 'none' }}>
                        <motion.div
                            initial={{ opacity: 0, y: 4, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                            style={{
                                padding: '5px 10px',
                                background: '#ffffff',
                                color: '#3b82f6',
                                fontSize: '11px',
                                fontWeight: 500,
                                borderRadius: '6px',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                        >
                            {label}
                            <div style={{
                                position: 'absolute',
                                bottom: '-4px',
                                left: '50%',
                                transform: 'translateX(-50%) rotate(45deg)',
                                width: '8px',
                                height: '8px',
                                background: '#ffffff',
                                boxShadow: '2px 2px 4px rgba(0,0,0,0.05)' }} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ActionTooltip;
