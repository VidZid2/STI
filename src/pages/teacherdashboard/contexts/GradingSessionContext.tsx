/**
 * GradingSessionContext — Phase 19 (GradingSidebar prop reduction).
 *
 * Holds the stable, session-level grading state that was previously
 * passed as 23 individual props through GradeSubmissionsModal → GradingSidebar.
 *
 * What lives here:
 *  - Course/task selection state
 *  - Display preferences (animate, avatar, compact)
 *  - Batch AI grading state + handlers
 *  - Computed lists (activeTasks, availableTasks, baseFilteredSubmissions)
 *  - AI configuration check
 *
 * What stays as props on GradingSidebar (changes per render):
 *  - filteredSubmissions, selectedSubmissionId, stats, isLoadingData
 *  - sortBy, filterStatus, searchQuery, isSearching, viewMode
 *  - batchSelected, handleFlag, handleSearchChange, toggleBatchSelect
 */

import React, { createContext, useContext } from 'react';
import type { Task, Submission, Course } from '../grading/types';
import type { AIGradingResult } from '../../../lib/grading';
import type { GradingSettings } from '../contexts/GradingSettingsContext';

export interface GradingSessionState {
    // Stable data
    submissions: Submission[];
    tasks: Task[];
    courses: Course[];
    activeTasks: Task[];
    availableTasks: Task[];
    baseFilteredSubmissions: Submission[];

    // Course/task filter selection
    selectedCourse: string;
    setSelectedCourse: (v: string) => void;
    selectedTask: string;
    setSelectedTask: (v: string) => void;

    // Display preferences
    shouldAnimate: boolean;
    shouldShowAvatar: boolean;
    isCompact: boolean;
    gradingSettings: GradingSettings;

    // Batch AI state
    isBatchAIGrading: boolean;
    batchAIProgress: { current: number; total: number; studentName: string } | null;
    batchAIResults: Map<string, AIGradingResult> | null;
    showBatchAIReview: boolean;
    setShowBatchModal: (v: boolean) => void;
    handleApplyBatchAIResults: () => void;
    handleBatchAIGrade: () => void;
    handleCancelBatchAIReview: () => void;
    isAIGradingConfigured: () => boolean;
}

const GradingSessionContext = createContext<GradingSessionState | null>(null);

export const GradingSessionProvider: React.FC<{
    children: React.ReactNode;
    value: GradingSessionState;
}> = ({ children, value }) => (
    <GradingSessionContext.Provider value={value}>
        {children}
    </GradingSessionContext.Provider>
);

export const useGradingSession = (): GradingSessionState => {
    const ctx = useContext(GradingSessionContext);
    if (!ctx) throw new Error('useGradingSession must be used within GradingSessionProvider');
    return ctx;
};

export default GradingSessionContext;
