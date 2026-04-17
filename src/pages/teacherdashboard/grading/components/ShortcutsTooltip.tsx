/**
 * ShortcutsTooltip — Portal-rendered hover tooltip for the keyboard shortcuts button.
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';

interface ShortcutsTooltipProps {
    visible: boolean;
    x: number;
    y: number;
}

const ShortcutsTooltip: React.FC<ShortcutsTooltipProps> = ({ visible, x, y }) => createPortal(
    <AnimatePresence>
        {visible && (
            <motion.div
                initial={{ opacity: 0, y: -6, x: '-50%' }}
                animate={{ opacity: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, y: -6, x: '-50%' }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                className="fixed z-[99999] pointer-events-none"
                style={{ top: y, left: x }}
            >
                {/* Arrow */}
                <div className="absolute w-3 h-1.5 overflow-hidden" style={{ top: '-6px', left: '50%', transform: 'translateX(-50%)' }}>
                    <div className="absolute w-2.5 h-2.5 rotate-45"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', top: '3px', left: '1px', boxShadow: '0 -1px 3px rgba(0,0,0,0.04)' }} />
                </div>
                {/* Body */}
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[10px] whitespace-nowrap"
                    style={{ background: 'var(--bg-surface)', boxShadow: '0 4px 20px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06)', border: '1px solid var(--border-subtle)' }}>
                    <div className="w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0"
                        style={{ background: 'var(--accent-bg)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="4" width="20" height="16" rx="2" />
                            <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10" />
                        </svg>
                    </div>
                    <div>
                        <div className="text-xs font-semibold tracking-[0.01em]" style={{ color: 'var(--text-primary)' }}>Keyboard Shortcuts</div>
                        <div className="text-[11px] mt-px" style={{ color: 'var(--text-secondary)' }}>View all available shortcuts</div>
                    </div>
                </div>
            </motion.div>
        )}
    </AnimatePresence>,
    document.body
);

export default ShortcutsTooltip;
