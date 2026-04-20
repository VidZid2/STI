import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const ActionTooltip: React.FC<{
    children: React.ReactNode;
    label: string;
    color: string;
}> = ({ children, label, color }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {children}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 2, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: '2px',
                            display: 'flex',
                            justifyContent: 'center',
                            pointerEvents: 'none',
                            zIndex: 50,
                        }}
                    >
                        <div style={{
                            position: 'relative',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: '#ffffff',
                            color: color,
                            border: `1px solid ${color}`,
                            fontSize: '11px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        }}>
                            {label}
                            <div style={{
                                position: 'absolute',
                                top: '-6px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: 0,
                                height: 0,
                                borderLeft: '6px solid transparent',
                                borderRight: '6px solid transparent',
                                borderBottom: `6px solid ${color}`,
                            }} />
                            <div style={{
                                position: 'absolute',
                                top: '-4px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: 0,
                                height: 0,
                                borderLeft: '5px solid transparent',
                                borderRight: '5px solid transparent',
                                borderBottom: '5px solid #ffffff',
                            }} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ActionTooltip;
