/**
 * GradeSubmissionsModal Types
 * Phase 1B: Extracted TypeScript interfaces and types
 * Updated: Added flexibility for Supabase integration
 */

// ============================================
// TASK TYPES
// ============================================

export type TaskType = 'assignment' | 'quiz' | 'performance' | 'journal' | 'practical' | 'other';

export interface Task {
    id: string;
    title: string;
    course_id: string;
    course_name?: string;
    type: TaskType;
    due_date: string;
    points: number;
    description?: string;
    rubric?: RubricCriteria[];
    submission_count?: number;
    graded_count?: number;
}

// ============================================
// SUBMISSION TYPES
// ============================================

export type SubmissionStatus = 'pending' | 'submitted' | 'graded' | 'late' | 'resubmitted' | 'ai-checked';

export interface Attachment {
    name: string;
    type: string;
    url: string;
    size?: number;
    textContent?: string; // Extracted text for AI grading
    [key: string]: unknown; // Index signature for type casting
}

export interface GradeHistory {
    score: number;
    feedback: string;
    graded_at: string;
    graded_by: string;
    version?: number;
}

export interface Submission {
    id: string;
    task_id: string;
    student_id: string;
    student_name: string;
    student_email?: string;
    section: string;
    text_content?: string; // Direct text submission
    submitted_at: string;
    graded_at?: string | null;
    status: SubmissionStatus;
    score: number | null;
    feedback?: string | null;
    attachments: Attachment[];
    is_late?: boolean;
    is_flagged?: boolean;
    similarity_score?: number;
    grade_history?: GradeHistory[];
    ai_feedback?: string;
    rubric_scores?: Record<string, number>;
    [key: string]: unknown; // Index signature for type casting
}

// ============================================
// COURSE TYPES
// ============================================

export interface Course {
    id: string;
    name?: string;
    code?: string;
    short_title?: string;
    title?: string;
    section?: string;
}

// ============================================
// RUBRIC TYPES
// ============================================

export interface RubricCriteria {
    id: string;
    name: string;
    description: string;
    points: number;
    max_points?: number;
    levels?: {
        score: number;
        label: string;
        description: string;
    }[];
}

// ============================================
// GRADING STATE TYPES
// ============================================

export interface DraftGrade {
    score: string | number | null;
    feedback: string;
    rubricScores: Record<string, number>;
    lastSaved: Date;
}

export type ViewMode = 'list' | 'split' | 'focus' | 'batch';
export type FilterStatus = 'all' | 'pending' | 'graded' | 'late' | 'flagged' | 'history';
export type SortOption = 'name' | 'date' | 'status' | 'score' | 'smart' | 'submitted';

// ============================================
// COMPONENT PROP TYPES
// ============================================

export interface GradeSubmissionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTaskId?: string;
}

export interface SubmissionCardProps {
    submission: Submission;
    task: Task | undefined;
    isSelected: boolean;
    onClick: () => void;
    onFlag: () => void;
    index: number;
    showCheckbox?: boolean;
    isChecked?: boolean;
    onCheck?: () => void;
}

export interface GradingPanelProps {
    submission: Submission;
    task: Task | undefined;
    draftGrade: DraftGrade;
    onScoreChange: (score: number | null) => void;
    onFeedbackChange: (feedback: string) => void;
    onRubricScoreChange: (criteriaId: string, score: number) => void;
    onSave: () => void;
    onSaveAndNext: () => void;
    onFlag: () => void;
    isAILoading: boolean;
    onGenerateAIFeedback: () => void;
}

export interface StatsBarProps {
    submissions: Submission[];
    tasks: Task[];
}

export interface FilePreviewPanelProps {
    attachment: Attachment | null;
    onClose: () => void;
}

export interface GradeHistoryPanelProps {
    history: GradeHistory[];
    onClose: () => void;
}

export interface GradingTimerProps {
    isRunning: boolean;
    elapsedSeconds: number;
    onToggle: () => void;
    onReset: () => void;
}

export interface BatchGradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedSubmissions: Submission[];
    task: Task | undefined;
    onBatchGrade: (score: number, feedback: string) => void;
}

export interface CustomDropdownProps {
    value: string;
    options: DropdownOption[];
    onChange: (value: string) => void;
    placeholder?: string;
    variant?: 'default' | 'purple';
    minWidth?: string;
}

export interface DropdownOption {
    id: string;
    label: string;
    icon?: React.ReactNode;
}

// ============================================
// STATISTICS TYPES
// ============================================

export interface GradingStats {
    graded: number;
    pending: number;
    late: number;
    total: number;
    avg: number;
    highest: number;
    lowest: number;
    distribution: GradeDistribution;
}

export interface GradeDistribution {
    A: number;
    B: number;
    C: number;
    D: number;
    F: number;
}

// ============================================
// AI & OUTLIER TYPES
// ============================================

export type OutlierType = 'exceptional' | 'struggling' | 'plagiarism' | 'late';

export interface OutlierIndicator {
    type: OutlierType;
    reason: string;
}

export interface BatchAIProgress {
    current: number;
    total: number;
    status: 'idle' | 'processing' | 'complete' | 'error';
    results: Array<{
        submissionId: string;
        success: boolean;
        feedback?: string;
        score?: number;
        error?: string;
    }>;
}

// ============================================
// KEYBOARD SHORTCUT TYPES
// ============================================

export interface KeyboardShortcut {
    key: string;
    action: string;
}
