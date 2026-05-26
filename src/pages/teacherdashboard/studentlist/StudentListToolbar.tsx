/**
 * StudentListToolbar — Toolbar for StudentListModal.
 * Extracted from StudentListModal (Phase 12.2).
 * Migrated: inline styles → Tailwind + CSS variables
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { ModalSearchInput } from '../components';
import { StudentListDropdown } from '../student';

type SortOption = 'name' | 'section' | 'recent';
type ViewMode = 'grid' | 'list';

interface StudentListToolbarProps {
    isMobile: boolean;
    isSmallMobile: boolean;
    searchQuery: string;
    isSearching: boolean;
    handleSearchChange: (value: string) => void;
    sectionFilter: string;
    setSectionFilter: (val: string) => void;
    sections: string[];
    sortBy: SortOption;
    setSortBy: (val: SortOption) => void;
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    viewTooltip: { visible: boolean; x: number; y: number; type: 'list' | 'grid' };
    setViewTooltip: React.Dispatch<React.SetStateAction<{ visible: boolean; x: number; y: number; type: 'list' | 'grid' }>>;
    listBtnRef: React.RefObject<HTMLButtonElement | null>;
    gridBtnRef: React.RefObject<HTMLButtonElement | null>;
    showExportMenu: boolean;
    setShowExportMenu: (show: boolean) => void;
    handleExport: (format: 'pdf' | 'excel') => void;
}

const StudentListToolbar: React.FC<StudentListToolbarProps> = ({
    isMobile, isSmallMobile,
    searchQuery, isSearching, handleSearchChange,
    sectionFilter, setSectionFilter, sections,
    sortBy, setSortBy,
    viewMode, setViewMode,
    viewTooltip, setViewTooltip,
    listBtnRef, gridBtnRef,
    showExportMenu, setShowExportMenu, handleExport,
}) => (
    <div
        className={`flex items-center flex-wrap bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] ${isMobile ? 'p-[12px_16px] gap-2' : 'p-[16px_24px] gap-3'}`}
    >
        {/* Search */}
        <ModalSearchInput
            value={searchQuery}
            onChange={handleSearchChange}
            onClear={() => handleSearchChange('')}
            placeholder={isMobile ? 'Search students...' : 'Search by name, email, or ID...'}
            isSearching={isSearching}
            flex={2}
            minWidth={isMobile ? '100%' : '280px'}
        />

        {/* Section Filter */}
        <StudentListDropdown
            value={sectionFilter} onChange={setSectionFilter}
            placeholder="All Sections" minWidth={isMobile ? '100px' : '140px'}
            options={[{ id: 'all', label: 'All Sections' }, ...sections.map(s => ({ id: s, label: s }))]}
        />

        {/* Sort */}
        <StudentListDropdown
            value={sortBy} onChange={(val) => setSortBy(val as SortOption)}
            placeholder="Sort by" minWidth={isMobile ? '90px' : '130px'}
            options={[{ id: 'name', label: 'Name' }, { id: 'section', label: 'Section' }, { id: 'recent', label: 'Recent' }]}
        />

        {/* View Toggle — desktop only */}
        {!isMobile && (
            <div className="flex relative overflow-visible rounded-[10px] border border-[var(--border-subtle)] bg-transparent">
                {([
                    { mode: 'list' as ViewMode, ref: listBtnRef, label: 'List view', icon: <><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></>, borderRadius: '10px 0 0 10px', borderLeft: 'none' },
                    { mode: 'grid' as ViewMode, ref: gridBtnRef, label: 'Grid view', icon: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>, borderRadius: '0 10px 10px 0', borderLeft: '1px solid var(--border-subtle)' },
                ]).map(({ mode, ref, label, icon, borderRadius, borderLeft }) => (
                    <div key={mode} className="relative"
                        onMouseEnter={() => {
                            if (ref.current) {
                                const rect = ref.current.getBoundingClientRect();
                                setViewTooltip({ visible: true, x: rect.left + rect.width / 2, y: rect.bottom + 10, type: mode });
                            }
                        }}
                        onMouseLeave={() => setViewTooltip(prev => ({ ...prev, visible: false }))}>
                        <motion.button
                            ref={ref} whileTap={{ scale: 0.95 }}
                            aria-label={label} onClick={() => setViewMode(mode)}
                            className="flex items-center justify-center cursor-pointer border-none p-[8px_12px]"
                            style={{
                                background: viewMode === mode ? 'var(--accent-primary)' : 'transparent',
                                color: viewMode === mode ? '#fff' : 'var(--text-secondary)',
                                borderRadius,
                                borderLeft,
                            }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{icon}</svg>
                        </motion.button>
                    </div>
                ))}
            </div>
        )}

        {/* View Toggle Tooltip */}
        {createPortal(
            <AnimatePresence>
                {viewTooltip.visible && (
                    <motion.div
                        key={viewTooltip.type}
                        initial={{ opacity: 0, y: -6, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -6, x: '-50%' }}
                        transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                        className="fixed z-[99999] pointer-events-none"
                        style={{ top: viewTooltip.y, left: viewTooltip.x }}
                    >
                        {/* Arrow */}
                        <div className="absolute w-3 h-1.5 overflow-hidden -translate-x-1/2 left-1/2 -top-1.5">
                            <div className="absolute w-2.5 h-2.5 rotate-45 bg-[var(--bg-surface)] border border-[var(--border-subtle)] top-[3px] left-[1px] shadow-[0_-1px_3px_rgba(0,0,0,0.04)]" />
                        </div>
                        {/* Body */}
                        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[10px] whitespace-nowrap bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[0_4px_20px_rgba(0,0,0,0.1),0_1px_4px_rgba(0,0,0,0.06)]">
                            <div className="w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0"
                                style={{ background: viewTooltip.type === 'list' ? 'var(--color-success-bg)' : 'var(--accent-bg)' }}>
                                {viewTooltip.type === 'list' ? (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                                        <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                                    </svg>
                                ) : (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                                        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <div className="text-xs font-semibold tracking-[0.01em] text-[var(--text-primary)]">
                                    {viewTooltip.type === 'list' ? 'List View' : 'Grid View'}
                                </div>
                                <div className="text-[11px] mt-px text-[var(--text-secondary)]">
                                    {viewTooltip.type === 'list' ? 'View students in a detailed list' : 'View students as profile cards'}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>,
            document.body
        )}

        {/* Export Button */}
        {!isSmallMobile && (
            <div className="relative">
                <motion.button
                    whileHover={{ background: 'var(--accent-bg)' }} whileTap={{ scale: 0.95 }}
                    aria-label="Export student list"
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className={`flex items-center gap-1.5 rounded-[10px] font-medium cursor-pointer border border-[var(--ring-focus)] text-[var(--accent-primary)] ${isMobile ? 'p-[8px_10px] text-[12px]' : 'p-[10px_14px] text-[13px]'}`}
                    style={{
                        background: showExportMenu ? 'var(--accent-bg)' : 'rgba(59,130,246,0.05)',
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    {!isMobile && 'Export'}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </motion.button>

                <AnimatePresence>
                    {showExportMenu && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-[calc(100%+8px)] right-0 rounded-xl overflow-hidden z-[100] min-w-[180px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                        >
                            {[
                                { format: 'pdf' as const, label: 'Export as PDF', sub: 'Grade report document', color: 'var(--color-danger)', bg: 'var(--color-danger-bg)', icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></> },
                                { format: 'excel' as const, label: 'Export as Excel', sub: 'Spreadsheet format', color: 'var(--color-success)', bg: 'var(--color-success-bg)', icon: <><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /></> },
                            ].map(({ format, label, sub, color, bg, icon }, i) => (
                                <React.Fragment key={format}>
                                    {i > 0 && <div className="h-px mx-3 bg-[var(--border-subtle)]" />}
                                    <motion.button
                                        whileHover={{ background: bg }}
                                        onClick={() => handleExport(format)}
                                        className="flex items-center gap-2.5 w-full px-4 py-3 border-none bg-transparent cursor-pointer text-[13px] font-medium text-left text-[var(--text-primary)]"
                                    >
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">{icon}</svg>
                                        </div>
                                        <div>
                                            <div>{label}</div>
                                            <div className="text-[11px] text-[var(--text-muted)]">{sub}</div>
                                        </div>
                                    </motion.button>
                                </React.Fragment>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        )}
    </div>
);

export default StudentListToolbar;
