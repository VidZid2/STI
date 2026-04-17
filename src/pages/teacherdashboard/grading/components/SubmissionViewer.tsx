import React from 'react';
import { AnimatePresence } from 'motion/react';
import { GradingPanel, FilePreviewModal } from './index';
import { ErrorBoundary } from '../../../../components/shared';
import type { Task, Submission, DraftGrade } from '../types';

interface SubmissionViewerProps {
    isMobile: boolean;
    gradingSettings: { autoSave: boolean; confirmSubmit: boolean; showAnalytics: boolean; latePenalty: boolean; latePenaltyPercent: number; [key: string]: any };
    filteredSubmissions: Submission[];
    selectedSubmission: Submission | undefined | null;
    selectedTask_obj: Task | undefined;
    selectedIndex: number;
    drafts: Record<string, DraftGrade>;
    handleGrade: (score: number, feedback: string) => void;
    handleNext: () => void;
    handlePrevious: () => void;
    handleFlag: (id: string) => void;
    handleDraftChange: (draft: DraftGrade) => void;
    previewFile: { name: string; url: string; type: string } | null;
    setPreviewFile: (file: { name: string; url: string; type: string } | null) => void;
    aiEnabled?: boolean;
}

const SubmissionViewer: React.FC<SubmissionViewerProps> = ({
    isMobile, gradingSettings,
    filteredSubmissions,
    selectedSubmission, selectedTask_obj, selectedIndex,
    drafts,
    handleGrade, handleNext, handlePrevious, handleFlag,
    handleDraftChange,
    previewFile, setPreviewFile,
    aiEnabled,
}) => {
    return (
        <>
            {selectedSubmission ? (
                <div className={`flex-1 flex flex-col bg-[var(--bg-surface)] relative ${isMobile ? 'min-h-[200px]' : ''}`}>
                    <ErrorBoundary name="GradingPanel">
                    <GradingPanel
                        submission={selectedSubmission}
                        task={selectedTask_obj}
                        onGrade={handleGrade}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        onFlag={() => handleFlag(selectedSubmission.id)}
                        hasNext={selectedIndex < filteredSubmissions.length - 1}
                        hasPrevious={selectedIndex > 0}
                        currentIndex={selectedIndex}
                        totalCount={filteredSubmissions.length}
                        draft={drafts[selectedSubmission.id] || null}
                        onDraftChange={handleDraftChange}
                        onPreviewFile={setPreviewFile}
                        gradingSettings={gradingSettings}
                        aiEnabled={aiEnabled}
                    />
                    </ErrorBoundary>
                    <AnimatePresence>
                        {previewFile && (
                            <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
                        )}
                    </AnimatePresence>
                </div>
            ) : (
                !isMobile && (
                    <div className="flex-1 flex flex-col items-center justify-center bg-[var(--bg-surface)] text-[var(--text-muted)] p-5">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-40">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <span className="text-sm font-medium">Select a submission</span>
                        <span className="text-xs mt-1">Choose from the list to start grading</span>
                    </div>
                )
            )}
        </>
    );
};

export default SubmissionViewer;
