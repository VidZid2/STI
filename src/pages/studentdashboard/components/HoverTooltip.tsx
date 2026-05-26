import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface HoverTooltipProps {
    visible: boolean;
    title: string;
    description: string;
    icon: React.ReactNode;
}

const HoverTooltip: React.FC<HoverTooltipProps> = ({ visible, title, description, icon }) => {
    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: -2, x: '-50%' }}
                    animate={{ opacity: 1, y: 6, x: '-50%' }}
                    exit={{ opacity: 0, y: -2, x: '-50%' }}
                    transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute z-[99999] pointer-events-none top-full left-1/2"
                >
                    {/* Arrow */}
                    <div className="absolute w-3 h-1.5 overflow-hidden" style={{ top: '-6px', left: '50%', transform: 'translateX(-50%)' }}>
                        <div className="absolute w-2.5 h-2.5 rotate-45"
                            style={{ background: 'var(--dashboard-surface, #ffffff)', border: '1px solid var(--border-color, #e5e7eb)', top: '3px', left: '1px', boxShadow: '0 -1px 3px rgba(0,0,0,0.04)' }} />
                    </div>
                    {/* Body */}
                    <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[10px] whitespace-nowrap"
                        style={{ background: 'var(--dashboard-surface, #ffffff)', boxShadow: '0 4px 20px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06)', border: '1px solid var(--border-color, #e5e7eb)' }}>
                        <div className="w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0"
                            style={{ background: 'var(--blue-50, #eff6ff)' }}>
                            {icon}
                        </div>
                        <div className="text-left">
                            <div className="text-xs font-semibold tracking-[0.01em] leading-tight" style={{ color: 'var(--text-primary, #1e293b)' }}>{title}</div>
                            <div className="text-[11px] mt-0.5 leading-tight" style={{ color: 'var(--text-secondary, #64748b)' }}>{description}</div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default HoverTooltip;
