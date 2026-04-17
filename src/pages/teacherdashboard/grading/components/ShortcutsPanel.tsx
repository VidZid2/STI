/**
 * ShortcutsPanel — Animated expandable panel listing all keyboard shortcuts.
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { KEYBOARD_SHORTCUTS } from '../constants';

const ShortcutsPanel: React.FC<{ visible: boolean }> = ({ visible }) => (
    <AnimatePresence>
        {visible && (
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
                style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--accent-bg)' }}
            >
                <div className="flex items-center justify-center flex-wrap gap-5 px-5 py-2.5">
                    {KEYBOARD_SHORTCUTS.map((s, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                            <kbd className="px-[5px] py-[2px] rounded text-[10px] font-semibold font-mono"
                                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
                                {s.key}
                            </kbd>
                            <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{s.action}</span>
                        </div>
                    ))}
                </div>
            </motion.div>
        )}
    </AnimatePresence>
);

export default ShortcutsPanel;
