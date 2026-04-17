/**
 * GradingToolbar — Header bar for GradeSubmissionsModal.
 * Extracted from GradeSubmissionsModal (Phase 12.1).
 */

import React from 'react';
import { motion } from 'motion/react';
import { GradingTimer, ShortcutsTooltip } from './index';
import { ModalCloseButton } from '../../components';
import type { ViewMode } from '../types';

interface GradingToolbarProps {
    isMobile: boolean;
    isSmallMobile: boolean;
    activeTab: 'assignments' | 'exams';
    setActiveTab: (tab: 'assignments' | 'exams') => void;
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    pendingCount: number;
    gradedCount: number;
    isOpen: boolean;
    gradedThisSession: number;
    showShortcuts: boolean;
    setShowShortcuts: (show: boolean) => void;
    shortcutTooltip: { visible: boolean; x: number; y: number };
    setShortcutTooltip: (tooltip: { visible: boolean; x: number; y: number }) => void;
    shortcutBtnRef: React.RefObject<HTMLButtonElement | null>;
    onClose: () => void;
}

const GradingToolbar: React.FC<GradingToolbarProps> = ({
    isMobile, isSmallMobile,
    activeTab, setActiveTab,
    viewMode, setViewMode,
    pendingCount, gradedCount,
    isOpen, gradedThisSession,
    showShortcuts, setShowShortcuts,
    shortcutTooltip, setShortcutTooltip,
    shortcutBtnRef, onClose,
}) => (
    <div
        className="responsive-modal-header flex items-center justify-between"
        style={{
            padding: isMobile ? '12px 16px' : '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
        }}
    >
        {/* Title */}
        <div className="flex items-center" style={{ gap: isMobile ? '10px' : '12px' }}>
            <div className="flex items-center justify-center shrink-0"
                style={{
                    width: isMobile ? '36px' : '40px',
                    height: isMobile ? '36px' : '40px',
                    borderRadius: isMobile ? '10px' : '12px',
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.05) 100%)',
                    border: '1px solid rgba(245,158,11,0.2)',
                    color: 'var(--color-warning)',
                }}>
                <svg width={isMobile ? '18' : '20'} height={isMobile ? '18' : '20'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
            </div>
            <div>
                <h2 id="grade-submissions-modal-title" className="m-0 font-bold" style={{ fontSize: isMobile ? '14px' : '16px', color: 'var(--text-primary)' }}>
                    {activeTab === 'assignments' ? 'Grade Submissions' : 'Input Exam Scores'}
                </h2>
                <p className="m-0" style={{ fontSize: isMobile ? '11px' : '12px', color: 'var(--text-secondary)' }}>
                    {activeTab === 'assignments' ? `${pendingCount} pending • ${gradedCount} graded` : 'Enter scores directly'}
                </p>
            </div>
        </div>

        {/* Tab toggle */}
        <div className="flex relative ml-auto" style={{
            width: '180px',
            background: 'var(--bg-surface-alt)',
            borderRadius: '8px',
            padding: '3px',
            marginRight: isMobile ? '6px' : '20px',
        }}>
            <motion.div layout transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="absolute rounded-md"
                style={{
                    top: '3px',
                    left: activeTab === 'assignments' ? '3px' : 'calc(50% + 1.5px)',
                    width: 'calc(50% - 4.5px)',
                    height: 'calc(100% - 6px)',
                    background: 'var(--bg-surface)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                }} />
            {(['assignments', 'exams'] as const).map((tab) => (
                <motion.button key={tab} whileTap={{ scale: 0.98 }} onClick={() => setActiveTab(tab)}
                    aria-label={tab === 'assignments' ? 'Activities tab' : 'Exams tab'}
                    aria-pressed={activeTab === tab}
                    className="flex-1 flex items-center justify-center rounded-md border-none text-xs font-semibold cursor-pointer relative z-[1]"
                    style={{
                        padding: isMobile ? '6px 4px' : '6px 8px',
                        background: 'transparent',
                        color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}>
                    {tab === 'assignments' ? 'Activities' : 'Exams'}
                </motion.button>
            ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center" style={{ gap: isMobile ? '6px' : '10px' }}>
            {!isSmallMobile && <GradingTimer isActive={isOpen} gradedCount={gradedThisSession} />}

            {/* View mode toggle */}
            {!isMobile && (
                <div className="flex relative rounded-lg p-[3px] transition-all"
                    style={{
                        background: 'var(--bg-surface-alt)',
                        opacity: activeTab === 'exams' ? 0.4 : 1,
                        pointerEvents: activeTab === 'exams' ? 'none' : 'auto',
                    }}>
                    <motion.div layout transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        className="absolute rounded-md"
                        style={{
                            top: '3px',
                            left: viewMode === 'split' ? '3px' : 'calc(50% + 1.5px)',
                            width: 'calc(50% - 4.5px)',
                            height: 'calc(100% - 6px)',
                            background: 'var(--bg-surface)',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                        }} />
                    {(['split', 'batch'] as ViewMode[]).map((mode) => (
                        <motion.button key={mode} whileTap={{ scale: 0.98 }} onClick={() => setViewMode(mode)}
                            aria-label={mode === 'split' ? 'Split view mode' : 'Batch grading mode'}
                            aria-pressed={viewMode === mode}
                            className="px-3 py-1.5 rounded-md border-none text-[11px] font-semibold cursor-pointer capitalize relative z-[1] transition-colors"
                            style={{ background: 'transparent', color: viewMode === mode ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                            {mode}
                        </motion.button>
                    ))}
                </div>
            )}

            {/* Shortcuts button */}
            {!isMobile && (
                <div className="relative"
                    onMouseEnter={() => {
                        if (shortcutBtnRef.current) {
                            const rect = shortcutBtnRef.current.getBoundingClientRect();
                            setShortcutTooltip({ visible: true, x: rect.left + rect.width / 2, y: rect.bottom + 10 });
                        }
                    }}
                    onMouseLeave={() => setShortcutTooltip({ ...shortcutTooltip, visible: false })}
                >
                    <motion.button
                        ref={shortcutBtnRef}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        aria-label="Keyboard shortcuts"
                        onClick={() => setShowShortcuts(!showShortcuts)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
                        style={{
                            border: '1px solid var(--border-subtle)',
                            background: showShortcuts ? 'var(--accent-bg)' : 'var(--bg-surface)',
                            color: showShortcuts ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="4" width="20" height="16" rx="2" />
                            <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10" />
                        </svg>
                    </motion.button>
                </div>
            )}

            <ShortcutsTooltip visible={shortcutTooltip.visible} x={shortcutTooltip.x} y={shortcutTooltip.y} />
            <ModalCloseButton onClose={onClose} size={32} />
        </div>
    </div>
);

export default GradingToolbar;
