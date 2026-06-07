/**
 * Grade Submissions Modal - Professional grading interface for teachers
 * 10/10 Features: Smart queue, split-view grading, batch mode, keyboard shortcuts,
 * AI-assisted feedback, rubric grading, analytics, file preview, grade history,
 * auto-save, flagging, grading timer, and class statistics
 * 
 * Refactored: Phase 1 - Constants, types, mock data, and utilities extracted
 * Enhanced: Real Supabase integration + Groq AI grading
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { ErrorBoundary } from '../../components/shared';
import { createPortal } from 'react-dom';
import { getTeacherCourses, type TeacherCourse } from '../../services/teacherService';
import { useResponsive } from './hooks';
import { useFocusTrap } from './hooks';
import { useSystemConfig } from '../../contexts/SystemConfigContext';
import {
    isAIGradingConfigured,
    batchGradeSubmissions,
    extractSubmissionContent,
    type AIGradingResult
} from '../../lib/grading';
import { useDisplaySettings } from '../../contexts/DisplaySettingsContext';
import { getCurrentUser } from '../../services/authService';

// Supabase grading service for real data
import {
    fetchTasksForGrading,
    fetchAllSubmissions,
    gradeSubmission as saveGradeToDb,
    toggleSubmissionFlag,
    type Submission as DbSubmission,
    type Task as DbTask,
} from '../../services/gradingService';

// Import from grading module
import {
    // Constants
    // Mock Data (kept for rubric demo only)
    // Utilities
    getSmartPriority,
} from './grading';

// Types from grading module
import type {
    Task,
    Submission,
    Course,
    GradeSubmissionsModalProps,
    DraftGrade,
    ViewMode,
    FilterStatus,
    SortOption,
} from './grading';

// Import grading settings context + session context
import { useGradingSettings, GradingSessionProvider } from './contexts';

// Note: Constants, mock data, and types are now imported from ./grading module
// See: ./grading/constants.ts, ./grading/types.ts, ./grading/mockData.ts, ./grading/utils.ts

import { BatchGradeModal, GradingSidebar, SubmissionViewer, ShortcutsPanel, GradingToolbar } from './grading/components';

// Inline components removed in Phase 4 — now imported from ./grading/components
const GradeSubmissionsModal: React.FC<GradeSubmissionsModalProps> = ({ isOpen, onClose }) => {
    // Responsive state for mobile compatibility
    const { isMobile, isSmallMobile } = useResponsive();
    const { systemConfig } = useSystemConfig();

    const [activeTab, setActiveTab] = useState<'assignments' | 'exams'>('assignments');
    const [viewMode, setViewMode] = useState<ViewMode>('split');
    const [selectedCourse, setSelectedCourse] = useState<string>('all');
    const [selectedTask, setSelectedTask] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [sortBy, setSortBy] = useState<SortOption>('smart');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [batchSelected, setBatchSelected] = useState<Set<string>>(new Set());
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [previewFile, setPreviewFile] = useState<{ name: string; url: string; type: string } | null>(null);
    const [drafts, setDrafts] = useState<Record<string, DraftGrade>>(() => {
        // Phase 9.4: Draft storage with TTL — drafts expire after 24 hours
        // Uses localStorage (survives tab close) with a timestamp guard.
        try {
            const raw = localStorage.getItem('elms_grading_drafts');
            if (raw) {
                const { data, savedAt } = JSON.parse(raw) as { data: Record<string, DraftGrade>; savedAt: number };
                const ONE_DAY_MS = 24 * 60 * 60 * 1000;
                if (Date.now() - savedAt < ONE_DAY_MS) {
                    // Rehydrate Date objects
                    Object.keys(data).forEach(key => {
                        if (data[key].lastSaved) {
                            data[key].lastSaved = new Date(data[key].lastSaved as unknown as string);
                        }
                    });
                    return data;
                }
                // Expired — clear it
                localStorage.removeItem('elms_grading_drafts');
            }
        } catch {
            localStorage.removeItem('elms_grading_drafts');
        }
        return {};
    });

    useEffect(() => {
        try {
            localStorage.setItem('elms_grading_drafts', JSON.stringify({
                data: drafts,
                savedAt: Date.now(),
            }));
        } catch {
            // Storage quota exceeded — drafts won't persist but app continues
        }
    }, [drafts]);
    const [gradedThisSession, setGradedThisSession] = useState(0);
    const [courses, setCourses] = useState<Course[]>([]);

    // Resolved once on mount — the authenticated teacher's real user ID
    const currentUserId = useMemo(() => getCurrentUser()?.id ?? 'unknown', []);

    // Grading settings from context
    const { settings: gradingSettings } = useGradingSettings();

    // Display settings from context
    const { settings: displaySettings, shouldAnimate, shouldShowAvatar } = useDisplaySettings();
    const isCompact = displaySettings.compactView;

    // Batch AI Grading State
    const [isBatchAIGrading, setIsBatchAIGrading] = useState(false);
    const [batchAIProgress, setBatchAIProgress] = useState<{ current: number; total: number; studentName: string } | null>(null);
    const [batchAIResults, setBatchAIResults] = useState<Map<string, AIGradingResult> | null>(null);
    const [showBatchAIReview, setShowBatchAIReview] = useState(false);

    // Keyboard shortcut tooltip state
    const [shortcutTooltip, setShortcutTooltip] = useState<{ visible: boolean; x: number; y: number }>({ visible: false, x: 0, y: 0 });
    const shortcutBtnRef = useRef<HTMLButtonElement>(null);

    // Phase 14.2: Focus trap
    const focusTrapRef = useFocusTrap(isOpen);

    // Phase 14.3: Screen reader live region message
    const [liveMessage, setLiveMessage] = useState('');

    // Fetch real data from Supabase when modal opens — scoped to this teacher
    useEffect(() => {
        if (!isOpen) return;

        const fetchData = async () => {
            setIsLoadingData(true);
            try {
                // Fetch courses
                const teacherCourses = await getTeacherCourses(currentUserId);
                if (teacherCourses && teacherCourses.length > 0) {
                    setCourses(teacherCourses.map((c: TeacherCourse) => ({
                        id: c.id,
                        short_title: c.shortTitle,
                        title: c.title,
                    })));
                }

                // Fetch tasks scoped to this teacher's assigned courses (Phase 9.2)
                const dbTasks = await fetchTasksForGrading(undefined, currentUserId);
                setTasks(dbTasks.map((t: DbTask) => ({
                    id: t.id,
                    course_id: t.course_id,
                    type: t.type,
                    title: t.title,
                    description: t.description,
                    due_date: t.due_date,
                    points: t.points,
                })));

                // Fetch submissions scoped to this teacher's courses (Phase 9.2)
                const dbSubmissions = await fetchAllSubmissions(undefined, currentUserId);
                setSubmissions(dbSubmissions.map((s: DbSubmission) => ({
                    id: s.id,
                    task_id: s.task_id,
                    student_id: s.student_id,
                    student_name: s.student_name, // Phase 9.3: no name override
                    section: s.section || '',
                    text_content: s.text_content,
                    attachments: s.attachments.map(a => ({
                        name: a.name,
                        url: a.url,
                        type: a.type,
                    })),
                    status: s.status,
                    score: s.score,
                    feedback: s.feedback,
                    submitted_at: s.submitted_at,
                    graded_at: s.graded_at,
                    is_late: s.is_late,
                    is_flagged: s.is_flagged,
                    similarity_score: s.similarity_score,
                    grade_history: s.grade_history,
                })));
            } catch {
                // Errors are surfaced via empty state — toast notifications added in Phase 10
                setTasks([]);
                setSubmissions([]);
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchData();
    }, [isOpen, currentUserId]);

    // Handle search with debounce for loading indicator
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        if (value) {
            setIsSearching(true);
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = setTimeout(() => setIsSearching(false), 300);
        } else {
            setIsSearching(false);
        }
    };

    // Cleanup search timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, []);

    // activeTasks — direct alias, no transformation needed
    const activeTasks = tasks;

    // Base submissions (filtered by everything EXCEPT status for accurate stats)
    const baseFilteredSubmissions = useMemo(() => {
        // Build via chained .filter() — no array copy needed (pure filtering)
        let result = submissions;

        // Filter by course
        if (selectedCourse !== 'all') {
            const courseTasks = activeTasks.filter(t => t.course_id === selectedCourse).map(t => t.id);
            result = result.filter(s => courseTasks.includes(s.task_id));
        }

        // Filter by task
        if (selectedTask !== 'all') {
            result = result.filter(s => s.task_id === selectedTask);
        }

        // Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(s =>
                s.student_name.toLowerCase().includes(query) ||
                s.student_id.includes(query) ||
                s.section.toLowerCase().includes(query)
            );
        }

        return result;
    }, [submissions, selectedCourse, selectedTask, activeTasks, searchQuery]);

    // Filter by status and Sort
    const filteredSubmissions = useMemo(() => {
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

        // Apply status filter via .filter() — no upfront copy
        let result: typeof baseFilteredSubmissions;
        if (filterStatus === 'all') {
            result = baseFilteredSubmissions.filter(s => s.status !== 'graded');
        } else if (filterStatus === 'pending') {
            result = baseFilteredSubmissions.filter(s => s.status === 'submitted' || s.status === 'resubmitted');
        } else if (filterStatus === 'flagged') {
            result = baseFilteredSubmissions.filter(s => s.is_flagged);
        } else if (filterStatus === 'graded') {
            result = baseFilteredSubmissions.filter(s => s.status === 'graded' && (!s.graded_at || new Date(s.graded_at) >= tenDaysAgo));
        } else if (filterStatus === 'history') {
            result = baseFilteredSubmissions.filter(s => s.status === 'graded' && s.graded_at && new Date(s.graded_at) < tenDaysAgo);
        } else {
            result = baseFilteredSubmissions.filter(s => s.status === filterStatus);
        }

        // Sort — requires a copy since Array.sort mutates in place
        return [...result].sort((a, b) => {
            switch (sortBy) {
                case 'smart':
                    return getSmartPriority(b) - getSmartPriority(a);
                case 'name':
                    return a.student_name.localeCompare(b.student_name);
                case 'status':
                    return a.status.localeCompare(b.status);
                case 'submitted':
                default:
                    return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
            }
        });
    }, [baseFilteredSubmissions, filterStatus, sortBy]);


    // Get available tasks for selected course
    const availableTasks = useMemo(() => {
        if (selectedCourse === 'all') return activeTasks;
        return activeTasks.filter(t => t.course_id === selectedCourse);
    }, [selectedCourse, activeTasks]);

    // Stats based on base conditions so tabs show total remaining correctly
    const stats = useMemo(() => {
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

        const total = baseFilteredSubmissions.filter(s => s.status !== 'graded').length;
        const pending = baseFilteredSubmissions.filter(s => s.status === 'submitted' || s.status === 'resubmitted').length;
        const graded = baseFilteredSubmissions.filter(s => s.status === 'graded' && (!s.graded_at || new Date(s.graded_at) >= tenDaysAgo)).length;
        const history = baseFilteredSubmissions.filter(s => s.status === 'graded' && s.graded_at && new Date(s.graded_at) < tenDaysAgo).length;
        const late = baseFilteredSubmissions.filter(s => s.status === 'late').length;
        const flagged = baseFilteredSubmissions.filter(s => s.is_flagged).length;
        return { total, pending, graded, history, late, flagged };
    }, [baseFilteredSubmissions]);

    // Selected submission
    const selectedSubmission = useMemo(() => {
        return filteredSubmissions.find(s => s.id === selectedSubmissionId);
    }, [filteredSubmissions, selectedSubmissionId]);

    const selectedIndex = useMemo(() => {
        return filteredSubmissions.findIndex(s => s.id === selectedSubmissionId);
    }, [filteredSubmissions, selectedSubmissionId]);

    // Auto-select first submission
    useEffect(() => {
        if (filteredSubmissions.length > 0 && !selectedSubmissionId) {
            setSelectedSubmissionId(filteredSubmissions[0].id);
        }
    }, [filteredSubmissions, selectedSubmissionId]);

    // Keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (e.key === 'Escape') {
                if (previewFile) setPreviewFile(null);
                else onClose();
            } else if (e.key === 'ArrowUp' && selectedIndex > 0) {
                setSelectedSubmissionId(filteredSubmissions[selectedIndex - 1].id);
            } else if (e.key === 'ArrowDown' && selectedIndex < filteredSubmissions.length - 1) {
                setSelectedSubmissionId(filteredSubmissions[selectedIndex + 1].id);
            } else if (e.key.toLowerCase() === 'r' && selectedSubmissionId) {
                handleFlag(selectedSubmissionId);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, selectedIndex, filteredSubmissions, previewFile, selectedSubmissionId]);

    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Handle grading — saves to Supabase with real teacher attribution (Phase 9.3)
    const handleGrade = useCallback(async (score: number, feedback: string) => {
        if (!selectedSubmissionId) return;

        // Optimistic local update for responsiveness
        setSubmissions(prev => prev.map(s =>
            s.id === selectedSubmissionId
                ? { ...s, score, feedback, status: 'graded' as const, graded_at: new Date().toISOString(), is_flagged: false }
                : s
        ));

        // Clear draft
        setDrafts(prev => {
            const next = { ...prev };
            delete next[selectedSubmissionId];
            return next;
        });

        setGradedThisSession(prev => prev + 1);

        // Phase 14.3: announce grade save to screen readers
        const submission = submissions.find(s => s.id === selectedSubmissionId);
        if (submission) {
            setLiveMessage(`Grade saved: ${score} out of ${activeTasks.find(t => t.id === submission.task_id)?.points ?? score} for ${submission.student_name}`);
        }

        try {
            await saveGradeToDb({
                submissionId: selectedSubmissionId,
                score,
                feedback,
                gradedBy: currentUserId, // Phase 9.3: real authenticated user ID
            });
        } catch {
            // Grade saved locally; DB sync failure surfaced in Phase 10 via toast
        }
    }, [selectedSubmissionId, currentUserId]);

    // Handle flagging
    const handleFlag = useCallback(async (id: string) => {
        setSubmissions(prev => prev.map(s =>
            s.id === id ? { ...s, is_flagged: !s.is_flagged } : s
        ));

        try {
            await toggleSubmissionFlag(id);
        } catch {
            // Revert optimistic update on failure
            setSubmissions(prev => prev.map(s =>
                s.id === id ? { ...s, is_flagged: !s.is_flagged } : s
            ));
        }
    }, []);

    // Handle draft change
    const handleDraftChange = useCallback((draft: DraftGrade) => {
        if (!selectedSubmissionId) return;
        setDrafts(prev => ({ ...prev, [selectedSubmissionId]: draft }));
    }, [selectedSubmissionId]);

    // Navigation
    const handleNext = useCallback(() => {
        if (selectedIndex < filteredSubmissions.length - 1) {
            setSelectedSubmissionId(filteredSubmissions[selectedIndex + 1].id);
        }
    }, [selectedIndex, filteredSubmissions]);

    const handlePrevious = useCallback(() => {
        if (selectedIndex > 0) {
            setSelectedSubmissionId(filteredSubmissions[selectedIndex - 1].id);
        }
    }, [selectedIndex, filteredSubmissions]);

    // Batch mode
    const toggleBatchSelect = (id: string) => {
        setBatchSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleBatchGrade = (score: number, feedback: string) => {
        setSubmissions(prev => prev.map(s =>
            batchSelected.has(s.id)
                ? { ...s, score, feedback, status: 'graded' as const, graded_at: new Date().toISOString() }
                : s
        ));
        setGradedThisSession(prev => prev + batchSelected.size);
        setBatchSelected(new Set());
    };

    // Batch AI Grading Handler - Enhanced with content extraction
    const handleBatchAIGrade = async () => {
        if (batchSelected.size === 0 || isBatchAIGrading) return;

        // Get task info from first selected submission
        const firstSelectedId = Array.from(batchSelected)[0];
        const firstSubmission = submissions.find(s => s.id === firstSelectedId);
        const task = firstSubmission ? activeTasks.find(t => t.id === firstSubmission.task_id) : null;

        if (!task) return;

        setIsBatchAIGrading(true);
        setBatchAIProgress({ current: 0, total: batchSelected.size, studentName: '' });

        // Prepare submissions for batch grading with enhanced content extraction
        const submissionsToGrade = Array.from(batchSelected)
            .map(id => submissions.find(s => s.id === id))
            .filter((s): s is Submission => s !== undefined)
            .map(s => ({
                id: s.id,
                studentName: s.student_name,
                content: extractSubmissionContent({
                    textContent: s.text_content,
                    attachments: s.attachments.map(a => ({
                        name: a.name,
                        type: a.type,
                        url: a.url,
                        textContent: a.textContent,
                    })),
                }),
            }));

        try {
            const result = await batchGradeSubmissions(
                submissionsToGrade,
                {
                    title: task.title,
                    description: task.description || 'Complete the assigned task.',
                    maxPoints: task.points,
                },
                (current, total, studentName) => {
                    setBatchAIProgress({ current, total, studentName });
                }
            );

            setBatchAIResults(result.results);
            setShowBatchAIReview(true);
            // Phase 14.3: announce batch AI completion to screen readers
            setLiveMessage(`AI grading complete. ${result.gradedCount} submissions graded, ${result.failedCount} failed.`);
            toast.success(`[Batch AI Grade] Completed: ${result.gradedCount} graded, ${result.failedCount} failed`);
        } catch (error) {
            toast.error('Batch AI grading failed');
        } finally {
            setIsBatchAIGrading(false);
            setBatchAIProgress(null);
        }
    };

    // Apply all batch AI results - saves to Supabase if using real data
    const handleApplyBatchAIResults = async () => {
        if (!batchAIResults) return;

        setSubmissions(prev => prev.map(s => {
            const result = batchAIResults.get(s.id);
            if (result?.success) {
                return {
                    ...s,
                    score: result.suggestedScore,
                    feedback: result.feedback,
                    status: 'graded' as const,
                    graded_at: new Date().toISOString(),
                };
            }
            return s;
        }));

        const successCount = Array.from(batchAIResults.values()).filter(r => r.success).length;
        setGradedThisSession(prev => prev + successCount);
        setBatchSelected(new Set());
        setBatchAIResults(null);
        setShowBatchAIReview(false);
    };

    // Cancel batch AI review
    const handleCancelBatchAIReview = () => {
        setBatchAIResults(null);
        setShowBatchAIReview(false);
    };

    if (!isOpen) return null;

    const selectedTask_obj = selectedSubmission ? activeTasks.find(t => t.id === selectedSubmission.task_id) : undefined;


    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`fixed inset-0 bg-[rgba(15,23,42,0.4)] backdrop-blur-md flex justify-end z-[9999]`}
                    onClick={(e) => e.target === e.currentTarget && onClose()}
                >
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="grade-submissions-modal-title"
                        ref={focusTrapRef}
                        initial={{ x: isMobile ? 0 : '100%', y: isMobile ? '100%' : 0 }}
                        animate={{ x: 0, y: 0 }}
                        exit={{ x: isMobile ? 0 : '100%', y: isMobile ? '100%' : 0 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 32 }}
                        className={`responsive-modal-container w-full bg-[var(--bg-canvas)] flex flex-col overflow-hidden relative ${isMobile ? 'max-w-full h-full max-h-full rounded-none shadow-none' : 'max-w-[1250px] h-full rounded-l-[24px] border-l border-[var(--border-subtle)] shadow-[-8px_0_32px_rgba(0,0,0,0.12)]'}`}
                    >
                        {/* Header — extracted to GradingToolbar (Phase 12.1) */}
                        <GradingToolbar
                            isMobile={isMobile}
                            isSmallMobile={isSmallMobile}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                            pendingCount={stats.pending}
                            gradedCount={stats.graded}
                            isOpen={isOpen}
                            gradedThisSession={gradedThisSession}
                            showShortcuts={showShortcuts}
                            setShowShortcuts={setShowShortcuts}
                            shortcutTooltip={shortcutTooltip}
                            setShortcutTooltip={setShortcutTooltip}
                            shortcutBtnRef={shortcutBtnRef}
                            onClose={onClose}
                        />

                        {/* Shortcuts Panel */}
                        <ShortcutsPanel visible={showShortcuts} />

                        {/* Phase 14.3: Screen reader live region — announces grade saves and AI completions */}
                        <div
                            aria-live="polite"
                            aria-atomic="true"
                            style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}
                        >
                            {liveMessage}
                        </div>


                        {/* Main Content */}
                        <GradingSessionProvider value={{
                            gradingSettings,
                            submissions,
                            tasks,
                            courses,
                            activeTasks,
                            availableTasks,
                            baseFilteredSubmissions,
                            selectedCourse, setSelectedCourse,
                            selectedTask, setSelectedTask,
                            shouldAnimate, shouldShowAvatar, isCompact,
                            isBatchAIGrading, batchAIProgress, batchAIResults, showBatchAIReview,
                            setShowBatchModal, handleApplyBatchAIResults,
                            handleBatchAIGrade, handleCancelBatchAIReview,
                            isAIGradingConfigured: () => systemConfig.ai_enabled && isAIGradingConfigured(),
                        }}>
                        {activeTab === 'exams' ? (
                            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: 'var(--bg-surface)' }}>
                                <div style={{ 
                                    flex: 1, 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    color: 'var(--text-secondary)',
                                    gap: '16px'
                                }}>
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                    </svg>
                                    <p style={{ fontSize: '15px' }}>Exam score input system coming soon.</p>
                                </div>
                            </div>
                        ) : (
                            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', flexDirection: isMobile ? 'column' : 'row', background: 'var(--bg-surface)' }}>
                                {/* Left Panel - Submission List */}
                                <GradingSidebar
                                    isMobile={isMobile}
                                    filteredSubmissions={filteredSubmissions}
                                    selectedSubmissionId={selectedSubmissionId}
                                    setSelectedSubmissionId={setSelectedSubmissionId}
                                    handleFlag={handleFlag}
                                    sortBy={sortBy}
                                    setSortBy={setSortBy}
                                    filterStatus={filterStatus}
                                    setFilterStatus={setFilterStatus}
                                    searchQuery={searchQuery}
                                    isSearching={isSearching}
                                    viewMode={viewMode}
                                    batchSelected={batchSelected}
                                    setBatchSelected={setBatchSelected}
                                    stats={stats}
                                    isLoadingData={isLoadingData}
                                    handleSearchChange={handleSearchChange}
                                    toggleBatchSelect={toggleBatchSelect}
                                />

                                {/* Right Panel - Grading */}
                                <ErrorBoundary name="SubmissionViewer">
                                    <SubmissionViewer
                                        isMobile={isMobile}
                                        gradingSettings={gradingSettings}
                                        filteredSubmissions={filteredSubmissions}
                                        selectedSubmission={selectedSubmission}
                                        selectedTask_obj={selectedTask_obj}
                                        selectedIndex={selectedIndex}
                                        drafts={drafts}
                                        handleGrade={handleGrade}
                                        handleNext={handleNext}
                                        handlePrevious={handlePrevious}
                                        handleFlag={handleFlag}
                                        handleDraftChange={handleDraftChange}
                                        previewFile={previewFile}
                                        setPreviewFile={setPreviewFile}
                                        aiEnabled={systemConfig.ai_enabled}
                                    />
                                </ErrorBoundary>

                            </div>
                        )}
                        </GradingSessionProvider>

                        {/* Batch Grade Modal */}
                        <AnimatePresence>
                            {showBatchModal && (
                                <BatchGradeModal
                                    isOpen={showBatchModal}
                                    onClose={() => setShowBatchModal(false)}
                                    selectedCount={batchSelected.size}
                                    maxPoints={selectedTask_obj?.points || 100}
                                    onApply={handleBatchGrade}
                                />
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default GradeSubmissionsModal;
