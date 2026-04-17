import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const PreviewIconWithTooltip: React.FC<{
    label: string;
    subtitle: string;
    color: string;
    bgColor: string;
    borderColor: string;
    children: React.ReactNode;
}> = ({ label, subtitle, color, bgColor, borderColor, children }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div style={{ position: 'relative', display: 'inline-flex' }}>
            <motion.div
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: bgColor,
                    border: `1px solid ${borderColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                }}
            >
                {children}
            </motion.div>

            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: 'absolute',
                            bottom: 'calc(100% + 12px)',
                            left: '50%',
                            zIndex: 100,
                            pointerEvents: 'none',
                        }}
                    >
                        <div style={{
                            position: 'relative',
                            background: 'var(--bg-surface)',
                            border: `1px solid ${borderColor}`,
                            borderRadius: '10px',
                            padding: '8px 12px',
                            boxShadow: `0 4px 16px ${bgColor}`,
                            whiteSpace: 'nowrap',
                            transform: 'translateX(-50%)',
                        }}>
                            <p style={{
                                margin: 0,
                                fontSize: '12px',
                                fontWeight: 600,
                                color: color,
                                textAlign: 'center',
                            }}>
                                {label}
                            </p>
                            <p style={{
                                margin: '2px 0 0 0',
                                fontSize: '10px',
                                color: color,
                                opacity: 0.7,
                                maxWidth: '140px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                textAlign: 'center',
                            }}>
                                {subtitle}
                            </p>
                            {/* Arrow pointing down */}
                            <div style={{
                                position: 'absolute',
                                width: '10px',
                                height: '10px',
                                background: 'var(--bg-surface)',
                                borderRight: `1px solid ${borderColor}`,
                                borderBottom: `1px solid ${borderColor}`,
                                bottom: '-6px',
                                left: '50%',
                                transform: 'translateX(-50%) rotate(45deg)',
                            }} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PreviewIconWithTooltip;
