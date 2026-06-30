import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CustomDropdown, StatsBar, SubmissionCard } from './index';
import { useGradingSession } from '../../contexts';
import type {
    Submission,
    ViewMode, FilterStatus, SortOption,
} from '../types';

// Props that change per-render stay here; stable session state comes from context
interface GradingSidebarProps {
    isMobile: boolean;
    filteredSubmissions: Submission[];
    selectedSubmissionId: string | null;
    setSelectedSubmissionId: (id: string | null) => void;
    handleFlag: (id: string) => void;
    sortBy: SortOption;
    setSortBy: (v: SortOption) => void;
    filterStatus: FilterStatus;
    setFilterStatus: (v: FilterStatus) => void;
    searchQuery: string;
    isSearching: boolean;
    viewMode: ViewMode;
    batchSelected: Set<string>;
    setBatchSelected: (v: Set<string>) => void;
    stats: { total: number; pending: number; graded: number; history: number; late: number; flagged: number };
    isLoadingData: boolean;
    handleSearchChange: (value: string) => void;
    toggleBatchSelect: (id: string) => void;
}

const GradingSidebar: React.FC<GradingSidebarProps> = ({
    isMobile,
    filteredSubmissions,
    selectedSubmissionId, setSelectedSubmissionId,
    handleFlag,
    sortBy, setSortBy,
    filterStatus, setFilterStatus,
    searchQuery, isSearching,
    viewMode,
    batchSelected, setBatchSelected,
    stats,
    isLoadingData, handleSearchChange, toggleBatchSelect,
}) => {
    // Stable session state from context (replaces 23 props)
    const {
        gradingSettings,
        submissions,
        courses,
        selectedCourse, setSelectedCourse,
        selectedTask, setSelectedTask,
        shouldAnimate, shouldShowAvatar, isCompact,
        isBatchAIGrading, batchAIProgress, batchAIResults, showBatchAIReview,
        setShowBatchModal, handleApplyBatchAIResults,
        activeTasks, availableTasks, baseFilteredSubmissions,
        handleBatchAIGrade, handleCancelBatchAIReview, isAIGradingConfigured,
    } = useGradingSession();

    return (
        <div className={`modal-sidebar flex flex-col bg-[var(--bg-canvas)] ${isMobile ? 'w-full border-b border-[var(--border-strong)] flex-auto overflow-auto' : 'w-[500px] min-w-[500px] border-r border-[var(--border-strong)]'}`}>
                                    {/* Stats Bar - Conditional based on showAnalytics setting, hide on mobile */}
                                    {gradingSettings.showAnalytics && !isMobile && (
                                        <div className="p-3">
                                            <StatsBar submissions={baseFilteredSubmissions} tasks={activeTasks} />
                                        </div>
                                    )}

                                    {/* Filters */}
                                    <div className={`border-b border-[var(--border-subtle)] ${isMobile ? 'p-[8px_12px]' : 'p-[0_16px_12px]'}`}>
                                        {/* Search */}
                                        <div className={`relative ${isMobile ? 'mb-2' : 'mb-2.5'}`}>
                                            {/* Search Icon */}
                                            <div className="absolute left-[10px] inset-y-0 flex items-center justify-center pointer-events-none z-[1]">
                                                <svg
                                                    width="14" height="14"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="#94a3b8"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="block"
                                                >
                                                    <circle cx="11" cy="11" r="8" />
                                                    <path d="m21 21-4.35-4.35" />
                                                </svg>
                                            </div>
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => handleSearchChange(e.target.value)}
                                                placeholder="Search students..."
                                                aria-label="Search submissions by student name or ID"
                                                style={{
                                                    width: '100%',
                                                    padding: isMobile ? '8px 36px 8px 32px' : '9px 36px 9px 32px',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--border-subtle)',
                                                    background: 'var(--bg-surface)',
                                                    fontSize: '13px',
                                                    color: 'var(--text-primary)',
                                                    outline: 'none',
                                                    transition: 'all 0.2s ease',
                                                }}
                                                onFocus={(e) => {
                                                    e.target.style.borderColor = 'var(--accent-primary)';
                                                    e.target.style.boxShadow = '0 0 0 3px var(--ring-focus)';
                                                }}
                                                onBlur={(e) => {
                                                    e.target.style.borderColor = 'var(--border-subtle)';
                                                    e.target.style.boxShadow = 'none';
                                                }}
                                            />
                                            {/* Loading Spinner */}
                                            <AnimatePresence>
                                                {isSearching && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.5 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.5 }}
                                                        transition={{ duration: 0.15 }}
                                                        className="absolute right-[10px] inset-y-0 flex items-center justify-center"
                                                    >
                                                        <motion.svg
                                                            width="14"
                                                            height="14"
                                                            viewBox="0 0 16 16"
                                                            fill="none"
                                                            className="block"
                                                            animate={{ rotate: 360 }}
                                                            transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                                                        >
                                                            <circle cx="8" cy="8" r="6" stroke="rgba(59, 130, 246, 0.15)" strokeWidth="2" fill="none" />
                                                            <circle cx="8" cy="8" r="6" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeDasharray="28" strokeDashoffset="21" fill="none" />
                                                        </motion.svg>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                            {/* Clear Search Button */}
                                            <AnimatePresence>
                                                {searchQuery && !isSearching && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.8 }}
                                                        transition={{ duration: 0.15 }}
                                                        className="absolute right-2 inset-y-0 flex items-center justify-center"
                                                    >
                                                        <motion.button
                                                            onClick={() => handleSearchChange('')}
                                                            aria-label="Clear search"
                                                            title="Clear search"
                                                            className="bg-[var(--bg-surface-alt)] border-none rounded-[6px] w-[20px] h-[20px] flex items-center justify-center cursor-pointer p-0"
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                        >
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="block">
                                                                <path d="M18 6L6 18M6 6l12 12" />
                                                            </svg>
                                                        </motion.button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Filter Row 1 - Course, Task & Sort */}
                                        <div className={`flex ${isMobile ? 'gap-1.5 mb-2 justify-center flex-wrap' : 'gap-2 mb-2.5 justify-start flex-nowrap'}`}>
                                            <CustomDropdown
                                                value={selectedCourse}
                                                onChange={(val) => { setSelectedCourse(val); setSelectedTask('all'); }}
                                                placeholder="Select a course"
                                                options={[
                                                    { id: 'all', label: 'All Courses' },
                                                    ...courses.map(c => ({
                                                        id: c.id,
                                                        label: c.short_title
                                                            ? `${c.short_title} - ${c.title || c.name || ''}`.trim()
                                                            : c.title || c.name || 'Course'
                                                    }))
                                                ]}
                                                minWidth={isMobile ? '120px' : '120px'}
                                            />
                                            <CustomDropdown
                                                value={selectedTask}
                                                onChange={(val) => setSelectedTask(val)}
                                                placeholder="Select a task"
                                                options={[
                                                    { id: 'all', label: 'All Tasks' },
                                                    ...availableTasks.map(t => ({ id: t.id, label: t.title }))
                                                ]}
                                                minWidth={isMobile ? '100px' : '120px'}
                                            />
                                            <CustomDropdown
                                                value={sortBy}
                                                onChange={(val) => setSortBy(val as SortOption)}
                                                variant="purple"
                                                minWidth={isMobile ? '90px' : '110px'}
                                                options={[
                                                    { id: 'smart', label: 'Smart', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg> },
                                                    { id: 'submitted', label: 'Recent' },
                                                    { id: 'name', label: 'Name' },
                                                ]}
                                            />
                                        </div>

                                        {/* Filter Row 2 - Status Pills with Container */}
                                        <div
                                            role="radiogroup"
                                            aria-label="Filter by submission status"
                                            className={`flex bg-[var(--bg-surface-alt)] [webkit-overflow-scrolling:touch] ${isMobile ? 'gap-px rounded-lg p-0.5 overflow-x-auto' : 'gap-0.5 rounded-[10px] p-[3px] overflow-x-visible'}`}>
                                            {([
                                                { value: 'all', label: 'All', count: stats.total },
                                                { value: 'pending', label: isMobile ? 'Pend' : 'Pending', count: stats.pending, color: '#3b82f6' },
                                                { value: 'graded', label: isMobile ? 'Done' : 'Graded', count: stats.graded, color: 'var(--color-success)' },
                                                { value: 'history', label: isMobile ? 'Hist' : 'History', count: stats.history, color: 'var(--color-purple)' },
                                                { value: 'late', label: 'Late', count: stats.late, color: 'var(--color-danger)' },
                                                { value: 'flagged', label: isMobile ? 'Flag' : 'Flagged', count: stats.flagged, color: 'var(--color-warning)' },
                                            ] as { value: FilterStatus; label: string; count: number; color?: string }[]).map((f) => (
                                                <motion.button
                                                    key={f.value}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => setFilterStatus(f.value)}
                                                    role="radio"
                                                    aria-checked={filterStatus === f.value}
                                                    aria-label={`${f.label}: ${f.count}`}
                                                    style={{
                                                        flex: 1,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: isMobile ? '2px' : '4px',
                                                        padding: isMobile ? '4px 6px' : '5px 10px',
                                                        borderRadius: isMobile ? '6px' : '8px',
                                                        border: 'none',
                                                        background: filterStatus === f.value ? 'var(--bg-surface)' : 'transparent',
                                                        boxShadow: filterStatus === f.value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                                                        color: filterStatus === f.value ? f.color || 'var(--text-primary)' : 'var(--text-secondary)',
                                                        fontSize: isMobile ? '10px' : '11px',
                                                        fontWeight: filterStatus === f.value ? 600 : 500,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s ease',
                                                        flexShrink: 0,
                                                        minWidth: isMobile ? 'auto' : undefined,
                                                    }}
                                                >
                                                    {f.label}
                                                    <span aria-hidden="true" style={{
                                                        fontSize: isMobile ? '9px' : '10px',
                                                        fontWeight: 700,
                                                        padding: isMobile ? '1px 4px' : '1px 5px',
                                                        borderRadius: '4px',
                                                        background: filterStatus === f.value ? `${f.color || 'var(--text-primary)'}15` : 'var(--border-subtle)',
                                                        color: filterStatus === f.value ? f.color || 'var(--text-primary)' : 'var(--text-secondary)',
                                                    }}>
                                                        {f.count}
                                                    </span>
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Screen reader live region — announces result count when filter/search changes */}
                                    <div
                                        aria-live="polite"
                                        aria-atomic="true"
                                        className="sr-only"
                                    >
                                        {!isLoadingData && (
                                            filteredSubmissions.length === 0
                                                ? 'No matching submissions'
                                                : `${filteredSubmissions.length} submission${filteredSubmissions.length === 1 ? '' : 's'} shown`
                                        )}
                                    </div>

                                    {/* Submissions List */}
                                    <div className={`modal-list-wrapper flex-1 overflow-auto bg-[var(--bg-surface)] ${isMobile ? 'p-[6px_8px] min-h-[100px]' : 'p-[8px_12px]'}`}>
                                        {isLoadingData ? (
                                            <div className={`flex flex-col items-center justify-center text-[var(--text-secondary)] ${isMobile ? 'h-[100px]' : 'h-[150px]'}`}>
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                    className="mb-2"
                                                >
                                                    <svg width={isMobile ? "20" : "24"} height={isMobile ? "20" : "24"} viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2">
                                                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                                    </svg>
                                                </motion.div>
                                                <span className={`${isMobile ? 'text-[11px]' : 'text-xs'}`}>Loading submissions...</span>
                                            </div>
                                        ) : filteredSubmissions.length === 0 ? (
                                            <div className={`flex flex-col items-center justify-center text-center text-[var(--text-secondary)] ${isMobile ? 'h-auto min-h-[80px] p-[16px_12px]' : 'h-[200px] min-h-[200px] p-5'}`}>
                                                <svg width={isMobile ? "32" : "48"} height={isMobile ? "32" : "48"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`opacity-40 ${isMobile ? 'mb-2' : 'mb-3'}`}>
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                    <polyline points="14 2 14 8 20 8" />
                                                    <line x1="9" y1="13" x2="15" y2="13" />
                                                    <line x1="9" y1="17" x2="13" y2="17" />
                                                </svg>
                                                <span className={`font-medium text-[var(--text-secondary)] mb-1 ${isMobile ? 'text-[13px]' : 'text-sm'}`}>
                                                    {submissions.length === 0 ? 'No submissions yet' : 'No matching submissions'}
                                                </span>
                                                <span className={`text-[var(--text-muted)] ${isMobile ? 'text-[11px] max-w-[220px]' : 'text-xs max-w-[200px]'}`}>
                                                    {submissions.length === 0
                                                        ? 'Submissions will appear here once students submit'
                                                        : 'Try adjusting your filters'
                                                    }
                                                </span>
                                            </div>
                                        ) : (
                                            filteredSubmissions.map((submission, index) => (
                                                <SubmissionCard
                                                    key={submission.id}
                                                    submission={submission}
                                                    task={activeTasks.find(t => t.id === submission.task_id)}
                                                    isSelected={selectedSubmissionId === submission.id}
                                                    onClick={() => setSelectedSubmissionId(submission.id)}
                                                    onFlag={() => handleFlag(submission.id)}
                                                    index={index}
                                                    showCheckbox={viewMode === 'batch'}
                                                    isChecked={batchSelected.has(submission.id)}
                                                    onCheck={() => toggleBatchSelect(submission.id)}
                                                    showAvatars={isMobile ? false : shouldShowAvatar}
                                                    shouldAnimate={isMobile ? false : shouldAnimate}
                                                    isCompact={isMobile ? true : isCompact}
                                                />
                                            ))
                                        )}
                                    </div>

                                    {/* Batch Actions */}
                                    {viewMode === 'batch' && batchSelected.size > 0 && !isBatchAIGrading && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-[10px_12px] border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-between"
                                        >
                                            <span className="text-xs font-medium text-[var(--text-primary)]">
                                                {batchSelected.size} selected
                                            </span>
                                            <div className="flex gap-[6px]">
                                                <motion.button
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => setBatchSelected(new Set())}
                                                    className="p-[6px_10px] rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] text-[11px] font-medium cursor-pointer"
                                                >
                                                    Clear
                                                </motion.button>
                                                {/* AI Grade All Button */}
                                                {isAIGradingConfigured() && (
                                                    <motion.button
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={handleBatchAIGrade}
                                                        className="flex items-center gap-1 p-[6px_10px] rounded-md border-none bg-[linear-gradient(135deg,#10b981_0%,#059669_100%)] text-white text-[11px] font-semibold cursor-pointer shadow-[0_2px_8px_rgba(16,185,129,0.25)]"
                                                    >
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                            <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                                                            <circle cx="12" cy="12" r="4" />
                                                        </svg>
                                                        AI Grade All
                                                    </motion.button>
                                                )}
                                                <motion.button
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => setShowBatchModal(true)}
                                                    className="p-[6px_10px] rounded-md border-none bg-[linear-gradient(135deg,#3b82f6_0%,#2563eb_100%)] text-white text-[11px] font-semibold cursor-pointer"
                                                >
                                                    Manual Grade
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Batch AI Grading Progress */}
                                    {isBatchAIGrading && batchAIProgress && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            style={{
                                                padding: '12px',
                                                borderTop: '1px solid var(--border-subtle)',
                                                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)',
                                            }}
                                        >
                                            <div className="flex items-center gap-2.5 mb-2">
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                                                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                                    </svg>
                                                </motion.div>
                                                <span className="text-xs font-semibold text-[var(--color-success)]">
                                                    AI Grading {batchAIProgress.current} of {batchAIProgress.total}
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-[var(--text-secondary)] mb-2">
                                                Analyzing: {batchAIProgress.studentName}...
                                            </div>
                                            <div className="h-1.5 bg-[var(--border-subtle)] rounded-[3px] overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(batchAIProgress.current / batchAIProgress.total) * 100}%` }}
                                                    style={{
                                                        height: '100%',
                                                        background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)',
                                                        borderRadius: '3px',
                                                    }}
                                                />
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Batch AI Review Panel */}
                                    {showBatchAIReview && batchAIResults && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]"
                                        >
                                            <div className="flex items-center justify-between mb-2.5">
                                                <div>
                                                    <div className="text-xs font-semibold text-[var(--text-primary)]">
                                                        AI Grading Complete
                                                    </div>
                                                    <div className="text-[11px] text-[var(--text-secondary)]">
                                                        {Array.from(batchAIResults.values()).filter(r => r.success).length} of {batchAIResults.size} graded successfully
                                                    </div>
                                                </div>
                                                <div className="flex gap-1.5">
                                                    <motion.button
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={handleCancelBatchAIReview}
                                                        className="p-[6px_10px] rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] text-[11px] font-medium cursor-pointer"
                                                    >
                                                        Cancel
                                                    </motion.button>
                                                    <motion.button
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={handleApplyBatchAIResults}
                                                        className="p-[6px_12px] rounded-md border-none bg-[linear-gradient(135deg,#10b981_0%,#059669_100%)] text-white text-[11px] font-semibold cursor-pointer"
                                                    >
                                                        Apply All Grades
                                                    </motion.button>
                                                </div>
                                            </div>
                                            {/* Preview of results */}
                                            <div className="max-h-[120px] overflow-auto text-[10px] text-[var(--text-secondary)]">
                                                {Array.from(batchAIResults.entries()).slice(0, 5).map(([id, result]) => {
                                                    const sub = submissions.find(s => s.id === id);
                                                    return (
                                                        <div key={id} className="flex items-center gap-2 py-1 border-b border-[rgba(0,0,0,0.04)]">
                                                            <span style={{
                                                                width: '8px',
                                                                height: '8px',
                                                                borderRadius: '50%',
                                                                background: result.success ? 'var(--color-success)' : 'var(--color-danger)',
                                                            }} />
                                                            <span className="flex-1">{sub?.student_name || 'Unknown'}</span>
                                                            {result.success ? (
                                                                <span className="font-semibold text-[var(--color-success)]">
                                                                    {result.suggestedScore} pts ({result.confidence}%)
                                                                </span>
                                                            ) : (
                                                                <span className="text-[var(--color-danger)]">Failed</span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                {batchAIResults.size > 5 && (
                                                    <div className="py-1 italic">
                                                        +{batchAIResults.size - 5} more...
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
    );
};

export default GradingSidebar;
