/**
 * KeyboardShortcuts
 * Keyboard shortcuts reference panel.
 * Extracted from FocusModePage.tsx during Phase 8.5
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { FocusModeColors } from '../FocusModePage';

// Keyboard Shortcuts Display Component
const KeyboardShortcuts: React.FC<{
    isDarkMode: boolean;
    colors: FocusModeColors;
}> = ({ isDarkMode, colors }) => {
    const shortcuts = [
        { key: 'Space', action: 'Start/Pause' },
        { key: 'R', action: 'Reset Timer' },
        { key: 'M', action: 'Toggle Sound' },
        { key: 'Esc', action: 'Exit Focus' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
            style={{
                padding: '14px 16px',
                borderRadius: '14px',
                background: isDarkMode ? '#1e293b' : '#ffffff',
                border: `1px solid ${colors.border}`,
            }}
        >
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
            }}>
                <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.06) 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3b82f6',
                }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="M6 8h.001" />
                        <path d="M10 8h.001" />
                        <path d="M14 8h.001" />
                        <path d="M18 8h.001" />
                        <path d="M8 12h.001" />
                        <path d="M12 12h.001" />
                        <path d="M16 12h.001" />
                        <path d="M7 16h10" />
                    </svg>
                </div>
                <span style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: colors.textPrimary,
                }}>
                    Shortcuts
                </span>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
            }}>
                {shortcuts.map((shortcut) => (
                    <div
                        key={shortcut.key}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >
                        <span style={{
                            padding: '3px 8px',
                            borderRadius: '5px',
                            background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                            fontSize: '10px',
                            fontWeight: 600,
                            color: colors.textSecondary,
                            fontFamily: 'ui-monospace, monospace',
                        }}>
                            {shortcut.key}
                        </span>
                        <span style={{
                            fontSize: '10px',
                            color: colors.textMuted,
                        }}>
                            {shortcut.action}
                        </span>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};


export { KeyboardShortcuts };
