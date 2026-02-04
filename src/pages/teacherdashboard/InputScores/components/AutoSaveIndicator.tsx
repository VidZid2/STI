/**
 * Auto-save Status Indicator Component
 */

import React from 'react';
import { motion } from 'motion/react';

interface AutoSaveIndicatorProps {
    hasUnsavedChanges: boolean;
    isAutoSaving: boolean;
    lastAutoSave: Date | null;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
    hasUnsavedChanges,
    isAutoSaving,
    lastAutoSave,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                marginTop: '12px',
                background: hasUnsavedChanges 
                    ? 'rgba(245, 158, 11, 0.06)' 
                    : 'rgba(16, 185, 129, 0.06)',
                borderRadius: '8px',
                border: `1px solid ${hasUnsavedChanges ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)'}`,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isAutoSaving ? (
                    <>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                                <path d="M21 12a9 9 0 11-6.219-8.56" />
                            </svg>
                        </motion.div>
                        <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 500 }}>
                            Auto-saving...
                        </span>
                    </>
                ) : hasUnsavedChanges ? (
                    <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 500 }}>
                            Unsaved changes
                        </span>
                    </>
                ) : (
                    <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 500 }}>
                            All changes saved
                        </span>
                    </>
                )}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                {lastAutoSave ? (
                    <>Last saved: {lastAutoSave.toLocaleTimeString()}</>
                ) : (
                    <>Auto-saves every 30s</>
                )}
            </div>
        </motion.div>
    );
};

export default AutoSaveIndicator;
