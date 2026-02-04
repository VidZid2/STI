/**
 * Input Exam Scores Modal - Enhanced with Batch Operations
 * Redesigned: Minimalistic blue design matching GroupsContent/CatalogContent
 * Connected to Supabase for real course data
 * 
 * Features:
 * - Course and exam selection with custom dropdowns
 * - Bulk score entry with validation
 * - Grade statistics preview
 * - Professional blue color scheme
 * 
 * BATCH OPERATIONS (Unique Features):
 * - Import from Excel/CSV (teachers already have scores in spreadsheets!)
 * - Copy scores from previous exam as baseline
 * - Apply curve - auto-adjust all scores by percentage
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { getCatalogCourses } from '../../services/catalogService';
import { getClassmates, type UserAccount } from '../../services/usersService';
import {
    getExamsByCourse,
    getExamScores,
    saveExamScores,
    getExamHistory,
    type ExamHistoryItem
} from '../../services/examsService';
import {
    calculateGrade,
    calculateClassStatistics,
    getGradeColor,
    type GradingSystem
} from '../../lib/grading/philippineGrading';
import {
    downloadCSV,
    openPrintView,
    type ExportScoreData,
    type ExportOptions
} from '../../lib/export/scoreExport';
import {
    calculateAttendanceFromScores,
    syncAttendanceFromExamScores,
} from '../../services/attendanceService';

// ============================================
// TYPES
// ============================================
interface Student {
    id: string;
    name: string;
    studentId: string;
    section: string;
}

interface ExamScore {
    studentId: string;
    studentName?: string;
    score: number | null;
    remarks?: string;
    isAbsent?: boolean;
    isExcused?: boolean;
}

type AttendanceStatus = 'present' | 'absent' | 'excused';

interface Exam {
    id: string;
    title: string;
    maxScore: number;
    date: string;
    courseId: string;
}

interface Course {
    id: string;
    title: string;
    shortTitle: string;
}

interface InputScoresModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: (examId: string, scores: ExamScore[]) => Promise<void>;
}

interface ImportedRow {
    studentId: string;
    studentName: string;
    score: number | null;
    matched: boolean;
    matchedStudentId?: string;
}

// ============================================
// GRADE WEIGHTING TYPES
// ============================================
// Only exam period categories - connected to database exam_type field
type ExamCategory = 'prelim' | 'midterm' | 'prefinal' | 'final';

interface CategoryWeight {
    category: ExamCategory;
    weight: number; // percentage (0-100)
    label: string;
    examCount: number; // Number of exams in this category from database
}

interface GradeWeightConfig {
    enabled: boolean;
    weights: CategoryWeight[];
}



// ============================================
// RUBRIC TYPES
// ============================================
interface RubricCriterion {
    id: string;
    name: string;
    maxPoints: number;
    description?: string;
}

interface RubricConfig {
    enabled: boolean;
    criteria: RubricCriterion[];
}

// ============================================
// AUDIT LOG TYPES
// ============================================
type AuditAction = 'score_entered' | 'score_updated' | 'score_deleted' | 'marked_absent' | 'marked_excused' | 'marked_present' | 'bulk_import' | 'curve_applied' | 'scores_saved';

interface AuditLogEntry {
    id: string;
    timestamp: string;
    action: AuditAction;
    userId: string;
    userName: string;
    studentId?: string;
    studentName?: string;
    previousValue?: string | number | null;
    newValue?: string | number | null;
    details?: string;
}

// Exam period weight presets for Philippine education (4 grading periods)
const WEIGHT_PRESETS: { name: string; weights: Omit<CategoryWeight, 'examCount'>[] }[] = [
    {
        name: 'Equal Distribution (25% each)',
        weights: [
            { category: 'prelim', weight: 25, label: 'Preliminaries' },
            { category: 'midterm', weight: 25, label: 'Midterm' },
            { category: 'prefinal', weight: 25, label: 'Pre-Final' },
            { category: 'final', weight: 25, label: 'Finals' },
        ],
    },
    {
        name: 'Finals Heavy (20%, 20%, 25%, 35%)',
        weights: [
            { category: 'prelim', weight: 20, label: 'Preliminaries' },
            { category: 'midterm', weight: 20, label: 'Midterm' },
            { category: 'prefinal', weight: 25, label: 'Pre-Final' },
            { category: 'final', weight: 35, label: 'Finals' },
        ],
    },
    {
        name: 'Progressive (15%, 20%, 30%, 35%)',
        weights: [
            { category: 'prelim', weight: 15, label: 'Preliminaries' },
            { category: 'midterm', weight: 20, label: 'Midterm' },
            { category: 'prefinal', weight: 30, label: 'Pre-Final' },
            { category: 'final', weight: 35, label: 'Finals' },
        ],
    },
    {
        name: 'Midterm Focus (20%, 30%, 25%, 25%)',
        weights: [
            { category: 'prelim', weight: 20, label: 'Preliminaries' },
            { category: 'midterm', weight: 30, label: 'Midterm' },
            { category: 'prefinal', weight: 25, label: 'Pre-Final' },
            { category: 'final', weight: 25, label: 'Finals' },
        ],
    },
];

// ============================================
// CSV PARSER UTILITY
// ============================================
const parseCSV = (text: string): string[][] => {
    const lines = text.trim().split(/\r?\n/);
    return lines.map(line => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    });
};

// ============================================
// IMPORT PREVIEW MODAL COMPONENT
// ============================================
const ImportPreviewModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    importedData: ImportedRow[];
    onConfirm: (data: ImportedRow[]) => void;
    maxScore: number;
}> = ({ isOpen, onClose, importedData, onConfirm, maxScore }) => {
    const [data, setData] = useState<ImportedRow[]>(importedData);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const confirmButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        setData(importedData);
    }, [importedData]);

    // Focus management - focus close button when modal opens
    useEffect(() => {
        if (isOpen && closeButtonRef.current) {
            closeButtonRef.current.focus();
        }
    }, [isOpen]);

    // Handle Escape key to close modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const matchedCount = data.filter(d => d.matched).length;
    const unmatchedCount = data.filter(d => !d.matched).length;
    const validScores = data.filter(d => d.matched && d.score !== null && d.score >= 0 && d.score <= maxScore).length;

    const handleScoreChange = (index: number, value: string) => {
        const numVal = value === '' ? null : parseFloat(value);
        setData(prev => prev.map((row, i) =>
            i === index ? { ...row, score: numVal } : row
        ));
    };

    if (!isOpen) return null;

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-preview-title"
            aria-describedby="import-preview-description"
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.7)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                padding: '20px',
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: '600px',
                    maxHeight: '80vh',
                    background: '#ffffff',
                    borderRadius: '20px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }} aria-hidden="true">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                        </div>
                        <div>
                            <h3 id="import-preview-title" style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                                Import Preview
                            </h3>
                            <p id="import-preview-description" style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                                Review and confirm imported scores
                            </p>
                        </div>
                    </div>
                    <motion.button
                        ref={closeButtonRef}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onClose}
                        aria-label="Close import preview"
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'rgba(0,0,0,0.04)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" aria-hidden="true">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </motion.button>
                </div>

                {/* Stats Bar */}
                <div
                    style={{
                        padding: '12px 24px',
                        background: 'rgba(59, 130, 246, 0.03)',
                        borderBottom: '1px solid rgba(0,0,0,0.04)',
                        display: 'flex',
                        gap: '16px',
                    }}
                    role="status"
                    aria-live="polite"
                    aria-label={`Import statistics: ${matchedCount} matched, ${unmatchedCount} unmatched, ${validScores} valid scores`}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} aria-hidden="true" />
                        <span style={{ fontSize: '12px', color: '#64748b' }}>Matched:</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#10b981' }}>{matchedCount}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} aria-hidden="true" />
                        <span style={{ fontSize: '12px', color: '#64748b' }}>Unmatched:</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#f59e0b' }}>{unmatchedCount}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} aria-hidden="true" />
                        <span style={{ fontSize: '12px', color: '#64748b' }}>Valid Scores:</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#3b82f6' }}>{validScores}</span>
                    </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
                    {/* Table Header */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 80px 60px',
                        gap: '8px',
                        padding: '8px 12px',
                        background: 'rgba(0,0,0,0.02)',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                    }}>
                        <span>Student</span>
                        <span style={{ textAlign: 'center' }}>Score</span>
                        <span style={{ textAlign: 'center' }}>Status</span>
                    </div>

                    {/* Rows */}
                    {data.map((row, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 80px 60px',
                                gap: '8px',
                                padding: '10px 12px',
                                alignItems: 'center',
                                borderRadius: '8px',
                                background: index % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)',
                                border: !row.matched ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid transparent',
                            }}
                        >
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                                    {row.studentName}
                                </div>
                                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                    {row.studentId}
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <input
                                    type="number"
                                    value={row.score ?? ''}
                                    onChange={(e) => handleScoreChange(index, e.target.value)}
                                    min={0}
                                    max={maxScore}
                                    style={{
                                        width: '60px',
                                        padding: '6px 8px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(0,0,0,0.08)',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        textAlign: 'center',
                                        outline: 'none',
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                {row.matched ? (
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </div>
                                ) : (
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        background: 'rgba(245, 158, 11, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="8" x2="12" y2="12" />
                                            <line x1="12" y1="16" x2="12.01" y2="16" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }} aria-live="polite">
                        Only matched students will be imported
                    </p>
                    <div style={{ display: 'flex', gap: '10px' }} role="group" aria-label="Import actions">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onClose}
                            aria-label="Cancel import"
                            style={{
                                padding: '10px 16px',
                                borderRadius: '10px',
                                border: '1px solid rgba(0,0,0,0.08)',
                                background: '#ffffff',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#64748b',
                                cursor: 'pointer',
                            }}
                        >
                            Cancel
                        </motion.button>
                        <motion.button
                            ref={confirmButtonRef}
                            whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(16, 185, 129, 0.25)' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onConfirm(data.filter(d => d.matched))}
                            disabled={matchedCount === 0}
                            aria-label={`Import ${matchedCount} scores`}
                            aria-disabled={matchedCount === 0}
                            style={{
                                padding: '10px 16px',
                                borderRadius: '10px',
                                border: 'none',
                                background: matchedCount > 0
                                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                    : 'rgba(0,0,0,0.06)',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: matchedCount > 0 ? '#ffffff' : '#94a3b8',
                                cursor: matchedCount > 0 ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Import {matchedCount} Scores
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
};

// ============================================
// COPY FROM PREVIOUS EXAM MODAL
// ============================================
// ExamHistoryItem is imported from examsService

const CopyFromExamModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSelect: (examHistory: ExamHistoryItem) => void;
    currentExamId: string;
    courseId: string;
    examHistory: ExamHistoryItem[];
    isLoadingHistory: boolean;
}> = ({ isOpen, onClose, onSelect, examHistory, isLoadingHistory }) => {
    const [selectedExam, setSelectedExam] = useState<string | null>(null);
    const [hoveredExam, setHoveredExam] = useState<string | null>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    // Focus management
    useEffect(() => {
        if (isOpen && closeButtonRef.current) {
            closeButtonRef.current.focus();
        }
    }, [isOpen]);

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Use the passed exam history (already filtered)
    const availableHistory = examHistory;

    const selectedHistoryItem = availableHistory.find(h => h.examId === selectedExam);

    if (!isOpen) return null;

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="copy-exam-title"
            aria-describedby="copy-exam-description"
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.7)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                padding: '20px',
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: '480px',
                    background: '#ffffff',
                    borderRadius: '20px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }} aria-hidden="true">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                        </div>
                        <div>
                            <h3 id="copy-exam-title" style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                                Copy from Previous Exam
                            </h3>
                            <p id="copy-exam-description" style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                                Use scores as a starting point
                            </p>
                        </div>
                    </div>
                    <motion.button
                        ref={closeButtonRef}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onClose}
                        aria-label="Close copy from exam dialog"
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'rgba(0,0,0,0.04)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" aria-hidden="true">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </motion.button>
                </div>

                {/* Content */}
                <div style={{ padding: '16px 24px', maxHeight: '320px', overflow: 'auto' }}>
                    {isLoadingHistory ? (
                        <div style={{
                            padding: '40px 20px',
                            textAlign: 'center',
                            color: '#94a3b8',
                        }}>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                style={{ display: 'inline-block', marginBottom: '12px' }}
                            >
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                                </svg>
                            </motion.div>
                            <p style={{ margin: 0, fontSize: '13px', fontWeight: 500 }}>
                                Loading exam history...
                            </p>
                        </div>
                    ) : availableHistory.length === 0 ? (
                        <div style={{
                            padding: '40px 20px',
                            textAlign: 'center',
                            color: '#94a3b8',
                        }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '12px', opacity: 0.5 }}>
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                            </svg>
                            <p style={{ margin: 0, fontSize: '13px', fontWeight: 500 }}>
                                No previous exams found
                            </p>
                            <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
                                Grade other exams first to copy scores
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {availableHistory.map((history, index) => {
                                const isSelected = selectedExam === history.examId;
                                const isHovered = hoveredExam === history.examId;

                                return (
                                    <motion.div
                                        key={history.examId}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onMouseEnter={() => setHoveredExam(history.examId)}
                                        onMouseLeave={() => setHoveredExam(null)}
                                        onClick={() => setSelectedExam(history.examId)}
                                        style={{
                                            padding: '14px 16px',
                                            borderRadius: '12px',
                                            border: isSelected
                                                ? '2px solid #8b5cf6'
                                                : `1px solid ${isHovered ? 'rgba(139, 92, 246, 0.3)' : 'rgba(0,0,0,0.06)'}`,
                                            background: isSelected
                                                ? 'rgba(139, 92, 246, 0.05)'
                                                : isHovered
                                                    ? 'rgba(0,0,0,0.01)'
                                                    : '#ffffff',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{
                                                    fontSize: '14px',
                                                    fontWeight: 600,
                                                    color: isSelected ? '#8b5cf6' : '#0f172a',
                                                    marginBottom: '4px',
                                                }}>
                                                    {history.examTitle}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                                    {new Date(history.date).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#3b82f6' }}>
                                                        {history.avgScore.toFixed(1)}
                                                    </div>
                                                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>AVG</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#10b981' }}>
                                                        {history.completedCount}
                                                    </div>
                                                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>SCORES</div>
                                                </div>
                                                {isSelected && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        style={{
                                                            width: '22px',
                                                            height: '22px',
                                                            borderRadius: '50%',
                                                            background: '#8b5cf6',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}
                                                    >
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                        {selectedHistoryItem
                            ? `${selectedHistoryItem.completedCount} scores will be copied`
                            : 'Select an exam to copy from'
                        }
                    </p>
                    <div style={{ display: 'flex', gap: '10px' }} role="group" aria-label="Copy exam actions">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onClose}
                            aria-label="Cancel copy from exam"
                            style={{
                                padding: '10px 16px',
                                borderRadius: '10px',
                                border: '1px solid rgba(0,0,0,0.08)',
                                background: '#ffffff',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#64748b',
                                cursor: 'pointer',
                            }}
                        >
                            Cancel
                        </motion.button>
                        <motion.button
                            whileHover={{
                                scale: 1.02,
                                boxShadow: '0 6px 20px rgba(139, 92, 246, 0.25)'
                            }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => selectedHistoryItem && onSelect(selectedHistoryItem)}
                            disabled={!selectedHistoryItem}
                            aria-label={selectedHistoryItem ? `Copy ${selectedHistoryItem.completedCount} scores from ${selectedHistoryItem.examTitle}` : 'Select an exam first'}
                            aria-disabled={!selectedHistoryItem}
                            style={{
                                padding: '10px 16px',
                                borderRadius: '10px',
                                border: 'none',
                                background: selectedHistoryItem
                                    ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                                    : 'rgba(0,0,0,0.06)',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: selectedHistoryItem ? '#ffffff' : '#94a3b8',
                                cursor: selectedHistoryItem ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                            Copy Scores
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
};

// ============================================
// APPLY CURVE MODAL
// ============================================
const ApplyCurveModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onApply: (adjustment: number, method: 'percentage' | 'points') => void;
    currentScores: ExamScore[];
    maxScore: number;
}> = ({ isOpen, onClose, onApply, currentScores, maxScore }) => {
    const [adjustment, setAdjustment] = useState<number>(5);
    const [method, setMethod] = useState<'percentage' | 'points'>('percentage');
    const [isHoveredApply, setIsHoveredApply] = useState(false);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const adjustmentInputRef = useRef<HTMLInputElement>(null);

    // Focus management
    useEffect(() => {
        if (isOpen && adjustmentInputRef.current) {
            adjustmentInputRef.current.focus();
            adjustmentInputRef.current.select();
        }
    }, [isOpen]);

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Calculate preview stats
    const previewStats = useMemo(() => {
        const validScores = currentScores.filter(s => s.score !== null);
        if (validScores.length === 0) {
            return { before: 0, after: 0, affected: 0 };
        }

        const beforeAvg = validScores.reduce((sum, s) => sum + (s.score || 0), 0) / validScores.length;

        let afterAvg: number;
        if (method === 'percentage') {
            afterAvg = beforeAvg * (1 + adjustment / 100);
        } else {
            afterAvg = beforeAvg + adjustment;
        }

        // Cap at max score
        afterAvg = Math.min(afterAvg, maxScore);

        return {
            before: Math.round(beforeAvg * 10) / 10,
            after: Math.round(afterAvg * 10) / 10,
            affected: validScores.length,
        };
    }, [currentScores, adjustment, method, maxScore]);

    // Quick adjustment presets
    const presets = [
        { label: '+5%', value: 5, method: 'percentage' as const },
        { label: '+10%', value: 10, method: 'percentage' as const },
        { label: '+5 pts', value: 5, method: 'points' as const },
        { label: '+10 pts', value: 10, method: 'points' as const },
    ];

    if (!isOpen) return null;

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="apply-curve-title"
            aria-describedby="apply-curve-description"
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.7)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                padding: '20px',
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                role="document"
                style={{
                    width: '100%',
                    maxWidth: '420px',
                    background: '#ffffff',
                    borderRadius: '20px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }} aria-hidden="true">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                                <path d="M2 20h20" />
                                <path d="M5 20V10l7-7 7 7v10" />
                                <path d="M9 20v-6h6v6" />
                            </svg>
                        </div>
                        <div>
                            <h3 id="apply-curve-title" style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                                Apply Curve
                            </h3>
                            <p id="apply-curve-description" style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                                Adjust all scores by percentage or points
                            </p>
                        </div>
                    </div>
                    <motion.button
                        ref={closeButtonRef}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onClose}
                        aria-label="Close apply curve dialog"
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'rgba(0,0,0,0.04)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" aria-hidden="true">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </motion.button>
                </div>

                {/* Content */}
                <div style={{ padding: '20px 24px' }}>
                    {/* Quick Presets */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#64748b',
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                        }}>
                            Quick Presets
                        </label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {presets.map((preset) => {
                                const isActive = adjustment === preset.value && method === preset.method;
                                return (
                                    <motion.button
                                        key={preset.label}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            setAdjustment(preset.value);
                                            setMethod(preset.method);
                                        }}
                                        style={{
                                            padding: '8px 14px',
                                            borderRadius: '8px',
                                            border: isActive
                                                ? '1px solid rgba(245, 158, 11, 0.4)'
                                                : '1px solid rgba(0,0,0,0.08)',
                                            background: isActive
                                                ? 'rgba(245, 158, 11, 0.1)'
                                                : '#ffffff',
                                            color: isActive ? '#f59e0b' : '#64748b',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {preset.label}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Custom Adjustment */}
                    <div style={{ marginBottom: '20px' }}>
                        <label
                            htmlFor="curve-adjustment-input"
                            style={{
                                display: 'block',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#64748b',
                                marginBottom: '8px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}
                        >
                            Custom Adjustment
                        </label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <input
                                    ref={adjustmentInputRef}
                                    id="curve-adjustment-input"
                                    type="number"
                                    value={adjustment}
                                    onChange={(e) => setAdjustment(parseFloat(e.target.value) || 0)}
                                    aria-label={`Adjustment value in ${method === 'percentage' ? 'percent' : 'points'}`}
                                    aria-describedby="curve-preview"
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        paddingRight: '40px',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(0,0,0,0.08)',
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        outline: 'none',
                                        transition: 'border-color 0.2s ease',
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(0,0,0,0.08)'}
                                />
                                <span style={{
                                    position: 'absolute',
                                    right: '14px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    fontSize: '14px',
                                    color: '#94a3b8',
                                    fontWeight: 500,
                                }} aria-hidden="true">
                                    {method === 'percentage' ? '%' : 'pts'}
                                </span>
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(0,0,0,0.08)',
                                    overflow: 'hidden',
                                }}
                                role="radiogroup"
                                aria-label="Adjustment method"
                            >
                                {(['percentage', 'points'] as const).map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => setMethod(m)}
                                        role="radio"
                                        aria-checked={method === m}
                                        aria-label={m === 'percentage' ? 'Percentage' : 'Points'}
                                        style={{
                                            padding: '12px 14px',
                                            border: 'none',
                                            background: method === m ? 'rgba(245, 158, 11, 0.1)' : '#ffffff',
                                            color: method === m ? '#f59e0b' : '#64748b',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease',
                                        }}
                                    >
                                        {m === 'percentage' ? '%' : 'Points'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Preview */}
                    <div style={{
                        padding: '16px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.06) 0%, rgba(245, 158, 11, 0.02) 100%)',
                        border: '1px solid rgba(245, 158, 11, 0.12)',
                    }}>
                        <div style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#64748b',
                            marginBottom: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                        }}>
                            Preview
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Before</div>
                                <div style={{ fontSize: '24px', fontWeight: 700, color: '#64748b' }}>
                                    {previewStats.before}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>After</div>
                                <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>
                                    {previewStats.after}
                                </div>
                            </div>
                            <div style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                background: 'rgba(16, 185, 129, 0.1)',
                            }}>
                                <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px' }}>Change</div>
                                <div style={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>
                                    +{adjustment}{method === 'percentage' ? '%' : ' pts'}
                                </div>
                            </div>
                        </div>
                        <div style={{
                            marginTop: '12px',
                            paddingTop: '12px',
                            borderTop: '1px solid rgba(0,0,0,0.06)',
                            fontSize: '12px',
                            color: '#64748b',
                            textAlign: 'center',
                        }}>
                            {previewStats.affected} scores will be adjusted (capped at {maxScore})
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div
                    style={{
                        padding: '16px 24px',
                        borderTop: '1px solid rgba(0,0,0,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '10px',
                    }}
                    role="group"
                    aria-label="Apply curve actions"
                >
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onClose}
                        aria-label="Cancel apply curve"
                        style={{
                            padding: '10px 16px',
                            borderRadius: '10px',
                            border: '1px solid rgba(0,0,0,0.08)',
                            background: '#ffffff',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#64748b',
                            cursor: 'pointer',
                        }}
                    >
                        Cancel
                    </motion.button>
                    <motion.button
                        whileHover={{
                            scale: 1.02,
                            boxShadow: '0 6px 20px rgba(245, 158, 11, 0.25)'
                        }}
                        whileTap={{ scale: 0.98 }}
                        onMouseEnter={() => setIsHoveredApply(true)}
                        onMouseLeave={() => setIsHoveredApply(false)}
                        onClick={() => onApply(adjustment, method)}
                        disabled={previewStats.affected === 0}
                        aria-label={`Apply ${adjustment}${method === 'percentage' ? '%' : ' points'} curve to ${previewStats.affected} scores`}
                        aria-disabled={previewStats.affected === 0}
                        style={{
                            padding: '10px 16px',
                            borderRadius: '10px',
                            border: 'none',
                            background: previewStats.affected > 0
                                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                                : 'rgba(0,0,0,0.06)',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: previewStats.affected > 0 ? '#ffffff' : '#94a3b8',
                            cursor: previewStats.affected > 0 ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: isHoveredApply && previewStats.affected > 0
                                ? '0 6px 20px rgba(245, 158, 11, 0.25)'
                                : 'none',
                            transition: 'box-shadow 0.2s ease',
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path d="M2 20h20" />
                            <path d="M5 20V10l7-7 7 7v10" />
                        </svg>
                        Apply Curve
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
};

// ============================================
// RUBRIC MODAL COMPONENT
// ============================================
export const RubricModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    rubricConfig: RubricConfig;
    onSave: (config: RubricConfig) => void;
    maxScore: number;
}> = ({ isOpen, onClose, rubricConfig, onSave, maxScore }) => {
    const [enabled, setEnabled] = useState(rubricConfig.enabled);
    const [criteria, setCriteria] = useState<RubricCriterion[]>(rubricConfig.criteria);
    const [newCriterionName, setNewCriterionName] = useState('');
    const [newCriterionPoints, setNewCriterionPoints] = useState<number>(10);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    // Sync state when rubricConfig changes
    useEffect(() => {
        setEnabled(rubricConfig.enabled);
        setCriteria(rubricConfig.criteria);
    }, [rubricConfig]);

    // Focus management
    useEffect(() => {
        if (isOpen && closeButtonRef.current) {
            closeButtonRef.current.focus();
        }
    }, [isOpen]);

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Calculate total points from criteria
    const totalPoints = useMemo(() =>
        criteria.reduce((sum, c) => sum + c.maxPoints, 0),
        [criteria]
    );

    // Check if total matches max score
    const pointsMatch = totalPoints === maxScore;
    const pointsDiff = maxScore - totalPoints;

    // Add new criterion
    const handleAddCriterion = () => {
        if (!newCriterionName.trim() || newCriterionPoints <= 0) return;

        const newCriterion: RubricCriterion = {
            id: `criterion-${Date.now()}`,
            name: newCriterionName.trim(),
            maxPoints: newCriterionPoints,
        };

        setCriteria(prev => [...prev, newCriterion]);
        setNewCriterionName('');
        setNewCriterionPoints(10);
    };

    // Remove criterion
    const handleRemoveCriterion = (id: string) => {
        setCriteria(prev => prev.filter(c => c.id !== id));
    };

    // Update criterion points
    const handleUpdatePoints = (id: string, points: number) => {
        setCriteria(prev => prev.map(c =>
            c.id === id ? { ...c, maxPoints: Math.max(0, points) } : c
        ));
    };

    // Update criterion name
    const handleUpdateName = (id: string, name: string) => {
        setCriteria(prev => prev.map(c =>
            c.id === id ? { ...c, name } : c
        ));
    };

    // Save rubric
    const handleSave = () => {
        onSave({ enabled, criteria });
        onClose();
    };

    // Quick templates
    const templates = [
        {
            name: 'Quiz (5 items)',
            criteria: [
                { id: 'q1', name: 'Question 1', maxPoints: Math.floor(maxScore / 5) },
                { id: 'q2', name: 'Question 2', maxPoints: Math.floor(maxScore / 5) },
                { id: 'q3', name: 'Question 3', maxPoints: Math.floor(maxScore / 5) },
                { id: 'q4', name: 'Question 4', maxPoints: Math.floor(maxScore / 5) },
                { id: 'q5', name: 'Question 5', maxPoints: maxScore - (Math.floor(maxScore / 5) * 4) },
            ],
        },
        {
            name: 'Essay',
            criteria: [
                { id: 'content', name: 'Content & Ideas', maxPoints: Math.floor(maxScore * 0.4) },
                { id: 'organization', name: 'Organization', maxPoints: Math.floor(maxScore * 0.25) },
                { id: 'grammar', name: 'Grammar & Mechanics', maxPoints: Math.floor(maxScore * 0.2) },
                { id: 'presentation', name: 'Presentation', maxPoints: maxScore - Math.floor(maxScore * 0.85) },
            ],
        },
        {
            name: 'Project',
            criteria: [
                { id: 'functionality', name: 'Functionality', maxPoints: Math.floor(maxScore * 0.4) },
                { id: 'design', name: 'Design & UI', maxPoints: Math.floor(maxScore * 0.25) },
                { id: 'code', name: 'Code Quality', maxPoints: Math.floor(maxScore * 0.2) },
                { id: 'documentation', name: 'Documentation', maxPoints: maxScore - Math.floor(maxScore * 0.85) },
            ],
        },
    ];

    const applyTemplate = (template: typeof templates[0]) => {
        setCriteria(template.criteria.map((c, i) => ({ ...c, id: `${c.id}-${Date.now()}-${i}` })));
    };

    if (!isOpen) return null;

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="rubric-title"
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.7)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                padding: '20px',
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: '560px',
                    maxHeight: '85vh',
                    background: '#ffffff',
                    borderRadius: '20px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                                <path d="M9 11l3 3L22 4" />
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                            </svg>
                        </div>
                        <div>
                            <h3 id="rubric-title" style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                                Rubric Settings
                            </h3>
                            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                                Define grading criteria with point breakdown
                            </p>
                        </div>
                    </div>
                    <motion.button
                        ref={closeButtonRef}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onClose}
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'rgba(0,0,0,0.04)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </motion.button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
                    {/* Enable Toggle */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 16px',
                        borderRadius: '12px',
                        background: enabled ? 'rgba(139, 92, 246, 0.06)' : 'rgba(0,0,0,0.02)',
                        border: `1px solid ${enabled ? 'rgba(139, 92, 246, 0.2)' : 'rgba(0,0,0,0.06)'}`,
                        marginBottom: '20px',
                    }}>
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                                Enable Rubric Grading
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                Break down scores by criteria
                            </div>
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setEnabled(!enabled)}
                            style={{
                                width: '48px',
                                height: '28px',
                                borderRadius: '14px',
                                border: 'none',
                                background: enabled ? '#8b5cf6' : 'rgba(0,0,0,0.1)',
                                cursor: 'pointer',
                                position: 'relative',
                                transition: 'background 0.2s ease',
                            }}
                        >
                            <motion.div
                                animate={{ x: enabled ? 20 : 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '12px',
                                    background: '#ffffff',
                                    position: 'absolute',
                                    top: '2px',
                                    left: '2px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                }}
                            />
                        </motion.button>
                    </div>

                    {enabled && (
                        <>
                            {/* Quick Templates */}
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: '#64748b',
                                    marginBottom: '8px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                }}>
                                    Quick Templates
                                </div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {templates.map((template) => (
                                        <motion.button
                                            key={template.name}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => applyTemplate(template)}
                                            style={{
                                                padding: '8px 14px',
                                                borderRadius: '8px',
                                                border: '1px solid rgba(139, 92, 246, 0.2)',
                                                background: 'rgba(139, 92, 246, 0.05)',
                                                color: '#8b5cf6',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {template.name}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Points Summary */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 16px',
                                borderRadius: '10px',
                                background: pointsMatch ? 'rgba(16, 185, 129, 0.06)' : 'rgba(245, 158, 11, 0.06)',
                                border: `1px solid ${pointsMatch ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                                marginBottom: '16px',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={pointsMatch ? '#10b981' : '#f59e0b'} strokeWidth="2">
                                        {pointsMatch ? (
                                            <polyline points="20 6 9 17 4 12" />
                                        ) : (
                                            <>
                                                <circle cx="12" cy="12" r="10" />
                                                <line x1="12" y1="8" x2="12" y2="12" />
                                                <line x1="12" y1="16" x2="12.01" y2="16" />
                                            </>
                                        )}
                                    </svg>
                                    <span style={{ fontSize: '13px', fontWeight: 500, color: pointsMatch ? '#10b981' : '#f59e0b' }}>
                                        {pointsMatch
                                            ? 'Points match exam total!'
                                            : `${pointsDiff > 0 ? pointsDiff + ' points remaining' : Math.abs(pointsDiff) + ' points over'}`
                                        }
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    color: pointsMatch ? '#10b981' : '#f59e0b',
                                }}>
                                    {totalPoints} / {maxScore} pts
                                </div>
                            </div>

                            {/* Criteria List */}
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: '#64748b',
                                    marginBottom: '10px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                }}>
                                    Criteria ({criteria.length})
                                </div>

                                {criteria.length === 0 ? (
                                    <div style={{
                                        padding: '24px',
                                        textAlign: 'center',
                                        color: '#94a3b8',
                                        fontSize: '13px',
                                        background: 'rgba(0,0,0,0.02)',
                                        borderRadius: '10px',
                                        border: '1px dashed rgba(0,0,0,0.1)',
                                    }}>
                                        No criteria added yet. Use a template or add manually below.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {criteria.map((criterion, index) => (
                                            <motion.div
                                                key={criterion.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.03 }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    padding: '10px 12px',
                                                    borderRadius: '10px',
                                                    background: '#ffffff',
                                                    border: '1px solid rgba(0,0,0,0.06)',
                                                }}
                                            >
                                                <div style={{
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '6px',
                                                    background: 'rgba(139, 92, 246, 0.1)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    color: '#8b5cf6',
                                                    flexShrink: 0,
                                                }}>
                                                    {index + 1}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={criterion.name}
                                                    onChange={(e) => handleUpdateName(criterion.id, e.target.value)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '6px 10px',
                                                        borderRadius: '6px',
                                                        border: '1px solid rgba(0,0,0,0.08)',
                                                        fontSize: '13px',
                                                        fontWeight: 500,
                                                        outline: 'none',
                                                    }}
                                                />
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <input
                                                        type="number"
                                                        value={criterion.maxPoints}
                                                        onChange={(e) => handleUpdatePoints(criterion.id, parseInt(e.target.value) || 0)}
                                                        min={0}
                                                        style={{
                                                            width: '60px',
                                                            padding: '6px 8px',
                                                            borderRadius: '6px',
                                                            border: '1px solid rgba(0,0,0,0.08)',
                                                            fontSize: '13px',
                                                            fontWeight: 600,
                                                            textAlign: 'center',
                                                            outline: 'none',
                                                        }}
                                                    />
                                                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>pts</span>
                                                </div>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => handleRemoveCriterion(criterion.id)}
                                                    style={{
                                                        width: '28px',
                                                        height: '28px',
                                                        borderRadius: '6px',
                                                        border: 'none',
                                                        background: 'rgba(239, 68, 68, 0.08)',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: '#ef4444',
                                                    }}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <line x1="18" y1="6" x2="6" y2="18" />
                                                        <line x1="6" y1="6" x2="18" y2="18" />
                                                    </svg>
                                                </motion.button>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Add New Criterion */}
                            <div style={{
                                padding: '14px 16px',
                                borderRadius: '12px',
                                background: 'rgba(0,0,0,0.02)',
                                border: '1px solid rgba(0,0,0,0.06)',
                            }}>
                                <div style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: '#64748b',
                                    marginBottom: '10px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                }}>
                                    Add Criterion
                                </div>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                                    <div style={{ flex: 1 }}>
                                        <input
                                            type="text"
                                            value={newCriterionName}
                                            onChange={(e) => setNewCriterionName(e.target.value)}
                                            placeholder="e.g., Question 1, Content, Design..."
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddCriterion()}
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                borderRadius: '8px',
                                                border: '1px solid rgba(0,0,0,0.08)',
                                                fontSize: '13px',
                                                outline: 'none',
                                            }}
                                        />
                                    </div>
                                    <div style={{ width: '80px' }}>
                                        <input
                                            type="number"
                                            value={newCriterionPoints}
                                            onChange={(e) => setNewCriterionPoints(parseInt(e.target.value) || 0)}
                                            min={1}
                                            placeholder="Points"
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                borderRadius: '8px',
                                                border: '1px solid rgba(0,0,0,0.08)',
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                textAlign: 'center',
                                                outline: 'none',
                                            }}
                                        />
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleAddCriterion}
                                        disabled={!newCriterionName.trim() || newCriterionPoints <= 0}
                                        style={{
                                            padding: '10px 16px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: newCriterionName.trim() && newCriterionPoints > 0
                                                ? '#8b5cf6'
                                                : 'rgba(0,0,0,0.06)',
                                            color: newCriterionName.trim() && newCriterionPoints > 0
                                                ? '#ffffff'
                                                : '#94a3b8',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            cursor: newCriterionName.trim() && newCriterionPoints > 0
                                                ? 'pointer'
                                                : 'not-allowed',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                        }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="12" y1="5" x2="12" y2="19" />
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                        </svg>
                                        Add
                                    </motion.button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '10px',
                }}>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onClose}
                        style={{
                            padding: '10px 16px',
                            borderRadius: '10px',
                            border: '1px solid rgba(0,0,0,0.08)',
                            background: '#ffffff',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#64748b',
                            cursor: 'pointer',
                        }}
                    >
                        Cancel
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(139, 92, 246, 0.25)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSave}
                        style={{
                            padding: '10px 16px',
                            borderRadius: '10px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Save Rubric
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
};

// ============================================
// GRADE WEIGHTING MODAL COMPONENT
// ============================================
const GradeWeightingModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    weightConfig: GradeWeightConfig;
    onSave: (config: GradeWeightConfig) => void;
    exams: Exam[];
}> = ({ isOpen, onClose, weightConfig, onSave, exams }) => {
    const [enabled, setEnabled] = useState(weightConfig.enabled);
    const [weights, setWeights] = useState<CategoryWeight[]>(weightConfig.weights);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    // Sync state when config changes
    useEffect(() => {
        setEnabled(weightConfig.enabled);
        setWeights(weightConfig.weights);
    }, [weightConfig]);

    // Focus management
    useEffect(() => {
        if (isOpen && closeButtonRef.current) {
            closeButtonRef.current.focus();
        }
    }, [isOpen]);

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Calculate total weight
    const totalWeight = useMemo(() =>
        weights.reduce((sum, w) => sum + w.weight, 0),
        [weights]
    );

    const isValidTotal = totalWeight === 100;

    // Get exam categories from database exams - only exam period types (prelim, midterm, prefinal, final)
    const examCategoriesFromDB = useMemo(() => {
        const categories = new Map<ExamCategory, { count: number; exams: string[] }>();

        exams.forEach(exam => {
            // Map exam title to category based on exam period from database
            let category: ExamCategory | null = null;
            const titleLower = exam.title.toLowerCase();

            if (titleLower.includes('prelim') || titleLower.includes('preliminary')) {
                category = 'prelim';
            } else if (titleLower.includes('midterm') || titleLower.includes('mid-term') || titleLower.includes('mid term')) {
                category = 'midterm';
            } else if (titleLower.includes('pre-final') || titleLower.includes('prefinal') || titleLower.includes('pre final')) {
                category = 'prefinal';
            } else if (titleLower.includes('final')) {
                category = 'final';
            }

            if (category) {
                const existing = categories.get(category) || { count: 0, exams: [] };
                categories.set(category, {
                    count: existing.count + 1,
                    exams: [...existing.exams, exam.title],
                });
            }
        });

        return categories;
    }, [exams]);

    // Update weight
    const handleUpdateWeight = (category: ExamCategory, newWeight: number) => {
        setWeights(prev => prev.map(w =>
            w.category === category ? { ...w, weight: Math.max(0, Math.min(100, newWeight)) } : w
        ));
    };

    // Add category
    const handleAddCategory = (category: ExamCategory, label: string) => {
        if (weights.some(w => w.category === category)) return;
        const examData = examCategoriesFromDB.get(category);
        setWeights(prev => [...prev, {
            category,
            weight: 0,
            label,
            examCount: examData?.count || 0,
        }]);
    };

    // Remove category
    const handleRemoveCategory = (category: ExamCategory) => {
        setWeights(prev => prev.filter(w => w.category !== category));
    };

    // Apply preset - add exam counts from database
    const applyPreset = (preset: typeof WEIGHT_PRESETS[0]) => {
        const weightsWithCounts = preset.weights.map(w => ({
            ...w,
            examCount: examCategoriesFromDB.get(w.category)?.count || 0,
        }));
        setWeights(weightsWithCounts);
    };

    // Save
    const handleSave = () => {
        onSave({ enabled, weights });
        onClose();
    };

    // Only exam period categories (4 grading periods)
    const allCategories: { category: ExamCategory; label: string }[] = [
        { category: 'prelim', label: 'Preliminaries' },
        { category: 'midterm', label: 'Midterm' },
        { category: 'prefinal', label: 'Pre-Final' },
        { category: 'final', label: 'Finals' },
    ];

    // Available categories to add (filter out already added ones)
    const availableCategories = allCategories.filter(c => !weights.some(w => w.category === c.category));

    // Check if there are any exams in the database for this course
    const hasExamsInDB = examCategoriesFromDB.size > 0;
    const totalExamsInDB = Array.from(examCategoriesFromDB.values()).reduce((sum, cat) => sum + cat.count, 0);

    if (!isOpen) return null;

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="weight-title"
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.7)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                padding: '20px',
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: '520px',
                    maxHeight: '85vh',
                    background: '#ffffff',
                    borderRadius: '20px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                                <path d="M12 20V10" />
                                <path d="M18 20V4" />
                                <path d="M6 20v-4" />
                            </svg>
                        </div>
                        <div>
                            <h3 id="weight-title" style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                                Exam Grade Weighting
                            </h3>
                            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                                Set exam weights for final grade calculation
                            </p>
                        </div>
                    </div>
                    <motion.button
                        ref={closeButtonRef}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onClose}
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'rgba(0,0,0,0.04)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </motion.button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
                    {/* Database Exams Info */}
                    {hasExamsInDB && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            background: 'rgba(16, 185, 129, 0.06)',
                            border: '1px solid rgba(16, 185, 129, 0.15)',
                            marginBottom: '16px',
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 500 }}>
                                {totalExamsInDB} exam{totalExamsInDB !== 1 ? 's' : ''} found in database
                            </span>
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                                {Array.from(examCategoriesFromDB.entries()).map(([cat, data]) => (
                                    <span key={cat} style={{
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        fontSize: '10px',
                                        fontWeight: 600,
                                        color: '#10b981',
                                        textTransform: 'capitalize',
                                    }}>
                                        {data.count} {cat}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Enable Toggle */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 16px',
                        borderRadius: '12px',
                        background: enabled ? 'rgba(59, 130, 246, 0.06)' : 'rgba(0,0,0,0.02)',
                        border: `1px solid ${enabled ? 'rgba(59, 130, 246, 0.2)' : 'rgba(0,0,0,0.06)'}`,
                        marginBottom: '20px',
                    }}>
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                                Enable Exam Weighting
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                Calculate weighted final grades from exams
                            </div>
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setEnabled(!enabled)}
                            style={{
                                width: '48px',
                                height: '28px',
                                borderRadius: '14px',
                                border: 'none',
                                background: enabled ? '#3b82f6' : 'rgba(0,0,0,0.1)',
                                cursor: 'pointer',
                                position: 'relative',
                                transition: 'background 0.2s ease',
                            }}
                        >
                            <motion.div
                                animate={{ x: enabled ? 20 : 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '12px',
                                    background: '#ffffff',
                                    position: 'absolute',
                                    top: '2px',
                                    left: '2px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                }}
                            />
                        </motion.button>
                    </div>

                    {enabled && (
                        <>
                            {/* Quick Presets */}
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: '#64748b',
                                    marginBottom: '8px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                }}>
                                    Quick Presets
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {WEIGHT_PRESETS.map((preset) => (
                                        <motion.button
                                            key={preset.name}
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={() => applyPreset(preset)}
                                            style={{
                                                padding: '10px 14px',
                                                borderRadius: '8px',
                                                border: '1px solid rgba(59, 130, 246, 0.15)',
                                                background: 'rgba(59, 130, 246, 0.03)',
                                                color: '#334155',
                                                fontSize: '12px',
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                            }}
                                        >
                                            {preset.name}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Total Weight Indicator */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 16px',
                                borderRadius: '10px',
                                background: isValidTotal ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)',
                                border: `1px solid ${isValidTotal ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                                marginBottom: '16px',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isValidTotal ? '#10b981' : '#ef4444'} strokeWidth="2">
                                        {isValidTotal ? (
                                            <polyline points="20 6 9 17 4 12" />
                                        ) : (
                                            <>
                                                <circle cx="12" cy="12" r="10" />
                                                <line x1="12" y1="8" x2="12" y2="12" />
                                                <line x1="12" y1="16" x2="12.01" y2="16" />
                                            </>
                                        )}
                                    </svg>
                                    <span style={{ fontSize: '13px', fontWeight: 500, color: isValidTotal ? '#10b981' : '#ef4444' }}>
                                        {isValidTotal
                                            ? 'Weights total 100%'
                                            : `Total: ${totalWeight}% (must equal 100%)`
                                        }
                                    </span>
                                </div>
                            </div>

                            {/* Weight Sliders */}
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: '#64748b',
                                    marginBottom: '10px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                }}>
                                    Category Weights
                                </div>

                                {weights.length === 0 ? (
                                    <div style={{
                                        padding: '24px',
                                        textAlign: 'center',
                                        color: '#94a3b8',
                                        fontSize: '13px',
                                        background: 'rgba(0,0,0,0.02)',
                                        borderRadius: '10px',
                                        border: '1px dashed rgba(0,0,0,0.1)',
                                    }}>
                                        No categories added. Use a preset or add categories below.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {weights.map((weight, index) => {
                                            const examData = examCategoriesFromDB.get(weight.category);
                                            const examCount = examData?.count || 0;
                                            return (
                                                <motion.div
                                                    key={weight.category}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.03 }}
                                                    style={{
                                                        padding: '12px 14px',
                                                        borderRadius: '10px',
                                                        background: '#ffffff',
                                                        border: '1px solid rgba(0,0,0,0.06)',
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                                                                {weight.label}
                                                            </span>
                                                            {examCount > 0 ? (
                                                                <span style={{
                                                                    padding: '2px 6px',
                                                                    borderRadius: '4px',
                                                                    background: 'rgba(16, 185, 129, 0.1)',
                                                                    fontSize: '10px',
                                                                    fontWeight: 600,
                                                                    color: '#10b981',
                                                                }}>
                                                                    {examCount} exam{examCount > 1 ? 's' : ''} in DB
                                                                </span>
                                                            ) : (
                                                                <span style={{
                                                                    padding: '2px 6px',
                                                                    borderRadius: '4px',
                                                                    background: 'rgba(245, 158, 11, 0.1)',
                                                                    fontSize: '10px',
                                                                    fontWeight: 600,
                                                                    color: '#f59e0b',
                                                                }}>
                                                                    No exams yet
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <input
                                                                type="number"
                                                                value={weight.weight}
                                                                onChange={(e) => handleUpdateWeight(weight.category, parseInt(e.target.value) || 0)}
                                                                min={0}
                                                                max={100}
                                                                style={{
                                                                    width: '60px',
                                                                    padding: '6px 8px',
                                                                    borderRadius: '6px',
                                                                    border: '1px solid rgba(0,0,0,0.08)',
                                                                    fontSize: '13px',
                                                                    fontWeight: 600,
                                                                    textAlign: 'center',
                                                                    outline: 'none',
                                                                }}
                                                            />
                                                            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>%</span>
                                                            <motion.button
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={() => handleRemoveCategory(weight.category)}
                                                                style={{
                                                                    width: '24px',
                                                                    height: '24px',
                                                                    borderRadius: '6px',
                                                                    border: 'none',
                                                                    background: 'rgba(239, 68, 68, 0.08)',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    color: '#ef4444',
                                                                }}
                                                            >
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <line x1="18" y1="6" x2="6" y2="18" />
                                                                    <line x1="6" y1="6" x2="18" y2="18" />
                                                                </svg>
                                                            </motion.button>
                                                        </div>
                                                    </div>
                                                    {/* Weight bar */}
                                                    <div style={{
                                                        height: '6px',
                                                        background: 'rgba(0,0,0,0.06)',
                                                        borderRadius: '3px',
                                                        overflow: 'hidden',
                                                    }}>
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${weight.weight}%` }}
                                                            transition={{ duration: 0.3 }}
                                                            style={{
                                                                height: '100%',
                                                                background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
                                                                borderRadius: '3px',
                                                            }}
                                                        />
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Add Category */}
                            {availableCategories.length > 0 && (
                                <div style={{
                                    padding: '12px 14px',
                                    borderRadius: '10px',
                                    background: 'rgba(0,0,0,0.02)',
                                    border: '1px solid rgba(0,0,0,0.06)',
                                }}>
                                    <div style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: '#64748b',
                                        marginBottom: '8px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                    }}>
                                        Add Category
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        {availableCategories.map((cat) => (
                                            <motion.button
                                                key={cat.category}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleAddCategory(cat.category, cat.label)}
                                                style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '6px',
                                                    border: '1px solid rgba(59, 130, 246, 0.2)',
                                                    background: 'rgba(59, 130, 246, 0.05)',
                                                    color: '#3b82f6',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                }}
                                            >
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <line x1="12" y1="5" x2="12" y2="19" />
                                                    <line x1="5" y1="12" x2="19" y2="12" />
                                                </svg>
                                                {cat.label}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {enabled && weights.length > 0 && (
                            <span>
                                Formula: {weights.map(w => `${w.label} × ${w.weight}%`).join(' + ')}
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onClose}
                            style={{
                                padding: '10px 16px',
                                borderRadius: '10px',
                                border: '1px solid rgba(0,0,0,0.08)',
                                background: '#ffffff',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#64748b',
                                cursor: 'pointer',
                            }}
                        >
                            Cancel
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(59, 130, 246, 0.25)' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSave}
                            disabled={enabled && !isValidTotal}
                            style={{
                                padding: '10px 16px',
                                borderRadius: '10px',
                                border: 'none',
                                background: (!enabled || isValidTotal)
                                    ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                                    : 'rgba(0,0,0,0.06)',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: (!enabled || isValidTotal) ? '#ffffff' : '#94a3b8',
                                cursor: (!enabled || isValidTotal) ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Save Weights
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
};

// ============================================
// AUDIT LOG MODAL COMPONENT
// ============================================
const AuditLogModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    auditLog: AuditLogEntry[];
}> = ({ isOpen, onClose, auditLog }) => {
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const [filter, setFilter] = useState<AuditAction | 'all'>('all');

    // Focus management
    useEffect(() => {
        if (isOpen && closeButtonRef.current) {
            closeButtonRef.current.focus();
        }
    }, [isOpen]);

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Filter log entries
    const filteredLog = useMemo(() => {
        if (filter === 'all') return auditLog;
        return auditLog.filter(entry => entry.action === filter);
    }, [auditLog, filter]);

    // Get action label and color
    const getActionInfo = (action: AuditAction): { label: string; color: string; icon: React.ReactNode } => {
        switch (action) {
            case 'score_entered':
                return {
                    label: 'Score Entered',
                    color: '#10b981',
                    icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                };
            case 'score_updated':
                return {
                    label: 'Score Updated',
                    color: '#3b82f6',
                    icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                };
            case 'score_deleted':
                return {
                    label: 'Score Deleted',
                    color: '#ef4444',
                    icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                };
            case 'marked_absent':
                return {
                    label: 'Marked Absent',
                    color: '#ef4444',
                    icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                };
            case 'marked_excused':
                return {
                    label: 'Marked Excused',
                    color: '#f59e0b',
                    icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                };
            case 'marked_present':
                return {
                    label: 'Marked Present',
                    color: '#10b981',
                    icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                };
            case 'bulk_import':
                return {
                    label: 'Bulk Import',
                    color: '#8b5cf6',
                    icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                };
            case 'curve_applied':
                return {
                    label: 'Curve Applied',
                    color: '#f59e0b',
                    icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 20h20" /><path d="M5 20V10l7-7 7 7v10" /></svg>
                };
            case 'scores_saved':
                return {
                    label: 'Scores Saved',
                    color: '#10b981',
                    icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                };
            default:
                return { label: action, color: '#64748b', icon: null };
        }
    };

    // Format timestamp
    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    if (!isOpen) return null;

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="audit-title"
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.7)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                padding: '20px',
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: '560px',
                    maxHeight: '85vh',
                    background: '#ffffff',
                    borderRadius: '20px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, rgba(100, 116, 139, 0.1) 0%, rgba(100, 116, 139, 0.05) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 id="audit-title" style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                                Grade History
                            </h3>
                            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                                {auditLog.length} change{auditLog.length !== 1 ? 's' : ''} recorded
                            </p>
                        </div>
                    </div>
                    <motion.button
                        ref={closeButtonRef}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onClose}
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'rgba(0,0,0,0.04)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </motion.button>
                </div>

                {/* Filter Bar */}
                <div style={{
                    padding: '12px 24px',
                    borderBottom: '1px solid rgba(0,0,0,0.04)',
                    display: 'flex',
                    gap: '6px',
                    flexWrap: 'wrap',
                }}>
                    {(['all', 'score_entered', 'score_updated', 'marked_absent', 'scores_saved'] as const).map((f) => (
                        <motion.button
                            key={f}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setFilter(f)}
                            style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                background: filter === f ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0,0,0,0.03)',
                                color: filter === f ? '#3b82f6' : '#64748b',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            {f === 'all' ? 'All' : getActionInfo(f).label}
                        </motion.button>
                    ))}
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
                    {filteredLog.length === 0 ? (
                        <div style={{
                            padding: '40px 20px',
                            textAlign: 'center',
                            color: '#94a3b8',
                        }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '12px', opacity: 0.5 }}>
                                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p style={{ margin: 0, fontSize: '13px', fontWeight: 500 }}>
                                No changes recorded yet
                            </p>
                            <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
                                Changes will appear here as you edit scores
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {filteredLog.map((entry, index) => {
                                const actionInfo = getActionInfo(entry.action);
                                return (
                                    <motion.div
                                        key={entry.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.02 }}
                                        style={{
                                            display: 'flex',
                                            gap: '12px',
                                            padding: '12px',
                                            borderRadius: '10px',
                                            background: 'rgba(0,0,0,0.02)',
                                            border: '1px solid rgba(0,0,0,0.04)',
                                        }}
                                    >
                                        {/* Action Icon */}
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '8px',
                                            background: `${actionInfo.color}15`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: actionInfo.color,
                                            flexShrink: 0,
                                        }}>
                                            {actionInfo.icon}
                                        </div>

                                        {/* Content */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                <span style={{
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    background: `${actionInfo.color}15`,
                                                    color: actionInfo.color,
                                                    fontSize: '10px',
                                                    fontWeight: 600,
                                                }}>
                                                    {actionInfo.label}
                                                </span>
                                                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                                    {formatTime(entry.timestamp)}
                                                </span>
                                            </div>

                                            {entry.studentName && (
                                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>
                                                    {entry.studentName}
                                                </div>
                                            )}

                                            {(entry.previousValue !== undefined || entry.newValue !== undefined) && (
                                                <div style={{ fontSize: '12px', color: '#64748b' }}>
                                                    {entry.previousValue !== null && entry.previousValue !== undefined && (
                                                        <span style={{ textDecoration: 'line-through', color: '#ef4444' }}>
                                                            {entry.previousValue}
                                                        </span>
                                                    )}
                                                    {entry.previousValue !== null && entry.previousValue !== undefined && entry.newValue !== null && entry.newValue !== undefined && (
                                                        <span style={{ margin: '0 6px', color: '#94a3b8' }}>→</span>
                                                    )}
                                                    {entry.newValue !== null && entry.newValue !== undefined && (
                                                        <span style={{ fontWeight: 600, color: '#10b981' }}>
                                                            {entry.newValue}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {entry.details && (
                                                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                                                    {entry.details}
                                                </div>
                                            )}

                                            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                                                by {entry.userName}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Showing {filteredLog.length} of {auditLog.length} entries
                    </span>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onClose}
                        style={{
                            padding: '10px 16px',
                            borderRadius: '10px',
                            border: 'none',
                            background: 'rgba(0,0,0,0.04)',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#64748b',
                            cursor: 'pointer',
                        }}
                    >
                        Close
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
};

// ============================================
// CUSTOM DROPDOWN COMPONENT - Minimalistic Blue Design
// ============================================
const CustomDropdown: React.FC<{
    value: string;
    options: { id: string; label: string }[];
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    label?: string;
    isLoading?: boolean;
}> = ({ value, options, onChange, placeholder = 'Select', disabled = false, label, isLoading = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.id === value);
    const isDisabled = disabled || isLoading;

    return (
        <div ref={dropdownRef} style={{ position: 'relative', flex: 1 }}>
            {label && (
                <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#64748b',
                    marginBottom: '8px',
                }}>
                    {label}
                </label>
            )}

            <motion.button
                whileTap={isDisabled ? {} : { scale: 0.99 }}
                onClick={() => !isDisabled && setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: isOpen
                        ? '1px solid rgba(59, 130, 246, 0.4)'
                        : '1px solid rgba(0,0,0,0.08)',
                    background: isDisabled ? 'rgba(0,0,0,0.02)' : '#ffffff',
                    color: selectedOption ? '#0f172a' : '#94a3b8',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isOpen ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
                    opacity: isDisabled ? 0.6 : 1,
                }}
            >
                <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}>
                    {isLoading && (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            style={{ display: 'flex', alignItems: 'center' }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                                <path d="M21 12a9 9 0 11-6.219-8.56" />
                            </svg>
                        </motion.div>
                    )}
                    {isLoading ? 'Loading...' : (selectedOption?.label || placeholder)}
                </span>
                <motion.svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ flexShrink: 0 }}
                >
                    <polyline points="6 9 12 15 18 9" />
                </motion.svg>
            </motion.button>

            <AnimatePresence>
                {isOpen && !isDisabled && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 6px)',
                            left: 0,
                            right: 0,
                            background: '#ffffff',
                            borderRadius: '12px',
                            border: '1px solid rgba(0,0,0,0.08)',
                            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12), 0 2px 10px rgba(0, 0, 0, 0.06)',
                            padding: '6px',
                            zIndex: 1000,
                            maxHeight: '240px',
                            overflowY: 'auto',
                        }}
                    >
                        {options.length === 0 ? (
                            <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                                No options available
                            </div>
                        ) : (
                            options.map((option, index) => {
                                const isSelected = option.id === value;
                                const isHovered = hoveredId === option.id;

                                return (
                                    <motion.button
                                        key={option.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.02 }}
                                        onMouseEnter={() => setHoveredId(option.id)}
                                        onMouseLeave={() => setHoveredId(null)}
                                        onClick={() => {
                                            onChange(option.id);
                                            setIsOpen(false);
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            width: '100%',
                                            padding: '10px 12px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: isSelected
                                                ? 'rgba(59, 130, 246, 0.1)'
                                                : isHovered
                                                    ? 'rgba(0,0,0,0.03)'
                                                    : 'transparent',
                                            color: isSelected ? '#3b82f6' : '#334155',
                                            fontSize: '14px',
                                            fontWeight: isSelected ? 600 : 500,
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'background 0.15s ease',
                                        }}
                                    >
                                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {option.label}
                                        </span>
                                        {isSelected && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                style={{
                                                    width: '18px',
                                                    height: '18px',
                                                    borderRadius: '50%',
                                                    background: '#3b82f6',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </motion.div>
                                        )}
                                    </motion.button>
                                );
                            })
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ============================================
// ATTENDANCE DROPDOWN COMPONENT - Minimalistic Blue Design
// Compact inline dropdown for table cells
// ============================================
const AttendanceDropdown: React.FC<{
    value: AttendanceStatus;
    onChange: (status: AttendanceStatus) => void;
    studentName: string;
}> = ({ value, onChange, studentName }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Calculate dropdown position to avoid overflow
    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const dropdownHeight = 140; // Approximate height of dropdown
            setDropdownPosition(spaceBelow < dropdownHeight ? 'top' : 'bottom');
        }
    }, [isOpen]);

    // Attendance options with blue color scheme
    const options: { id: AttendanceStatus; label: string; icon: React.ReactNode; color: string; bgColor: string }[] = [
        {
            id: 'present',
            label: 'Present',
            icon: (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
            ),
            color: '#3b82f6',
            bgColor: 'rgba(59, 130, 246, 0.1)',
        },
        {
            id: 'absent',
            label: 'Absent',
            icon: (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
            ),
            color: '#ef4444',
            bgColor: 'rgba(239, 68, 68, 0.1)',
        },
        {
            id: 'excused',
            label: 'Excused',
            icon: (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
            ),
            color: '#f59e0b',
            bgColor: 'rgba(245, 158, 11, 0.1)',
        },
    ];

    const selectedOption = options.find(o => o.id === value) || options[0];

    return (
        <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
            {/* Trigger Button */}
            <motion.button
                ref={buttonRef}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOpen(!isOpen)}
                aria-label={`Attendance status for ${studentName}: ${selectedOption.label}`}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: isOpen
                        ? `1px solid ${selectedOption.color}40`
                        : '1px solid rgba(0,0,0,0.06)',
                    background: isOpen ? selectedOption.bgColor : '#ffffff',
                    color: selectedOption.color,
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isOpen
                        ? `0 0 0 2px ${selectedOption.color}15`
                        : '0 1px 2px rgba(0,0,0,0.04)',
                    minWidth: '90px',
                }}
            >
                <span style={{ display: 'flex', alignItems: 'center' }}>
                    {selectedOption.icon}
                </span>
                <span style={{ flex: 1, textAlign: 'left' }}>
                    {selectedOption.label}
                </span>
                <motion.svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.15 }}
                    style={{ opacity: 0.6 }}
                >
                    <polyline points="6 9 12 15 18 9" />
                </motion.svg>
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: dropdownPosition === 'bottom' ? -6 : 6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: dropdownPosition === 'bottom' ? -6 : 6, scale: 0.95 }}
                        transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
                        role="listbox"
                        aria-label="Select attendance status"
                        style={{
                            position: 'absolute',
                            ...(dropdownPosition === 'bottom'
                                ? { top: 'calc(100% + 4px)' }
                                : { bottom: 'calc(100% + 4px)' }),
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: '#ffffff',
                            borderRadius: '10px',
                            border: '1px solid rgba(0,0,0,0.08)',
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)',
                            padding: '4px',
                            zIndex: 9999,
                            minWidth: '120px',
                        }}
                    >
                        {options.map((option, index) => {
                            const isSelected = option.id === value;
                            const isHovered = hoveredId === option.id;

                            return (
                                <motion.button
                                    key={option.id}
                                    role="option"
                                    aria-selected={isSelected}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    onMouseEnter={() => setHoveredId(option.id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                    onClick={() => {
                                        onChange(option.id);
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        width: '100%',
                                        padding: '8px 10px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: isSelected
                                            ? option.bgColor
                                            : isHovered
                                                ? 'rgba(0,0,0,0.03)'
                                                : 'transparent',
                                        color: isSelected ? option.color : '#475569',
                                        fontSize: '12px',
                                        fontWeight: isSelected ? 600 : 500,
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.1s ease',
                                    }}
                                >
                                    <span style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        color: isSelected || isHovered ? option.color : '#94a3b8',
                                        transition: 'color 0.1s ease',
                                    }}>
                                        {option.icon}
                                    </span>
                                    <span style={{ flex: 1 }}>
                                        {option.label}
                                    </span>
                                    {isSelected && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                            style={{
                                                width: '14px',
                                                height: '14px',
                                                borderRadius: '50%',
                                                background: option.color,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </motion.div>
                                    )}
                                </motion.button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ============================================
// STUDENT SCORE HISTORY MODAL - Mini Chart Component
// ============================================
interface StudentScoreHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: { id: string; name: string } | null;
    history: { examTitle: string; score: number; maxScore: number; date: string }[];
}

const StudentScoreHistoryModal: React.FC<StudentScoreHistoryModalProps> = ({
    isOpen,
    onClose,
    student,
    history,
}) => {
    if (!student) return null;

    // Calculate statistics
    const validScores = history.filter(h => h.score !== null);
    const percentages = validScores.map(h => (h.score / h.maxScore) * 100);
    const avgPercentage = percentages.length > 0
        ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length)
        : 0;
    const maxPercentage = percentages.length > 0 ? Math.max(...percentages) : 0;
    const minPercentage = percentages.length > 0 ? Math.min(...percentages) : 0;

    // Trend calculation
    const trend = percentages.length >= 2
        ? percentages[percentages.length - 1] - percentages[0]
        : 0;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.4)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 10000,
                        }}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        style={{
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '90%',
                            maxWidth: '480px',
                            background: '#ffffff',
                            borderRadius: '16px',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
                            zIndex: 10001,
                            overflow: 'hidden',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid rgba(0,0,0,0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                                        <path d="M3 3v18h18" />
                                        <path d="M18 17V9" />
                                        <path d="M13 17V5" />
                                        <path d="M8 17v-3" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
                                        Score History
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                                        {student.name}
                                    </p>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onClose}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: 'rgba(0,0,0,0.04)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </motion.button>
                        </div>

                        {/* Stats Summary */}
                        <div style={{
                            padding: '16px 20px',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '12px',
                            borderBottom: '1px solid rgba(0,0,0,0.06)',
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '20px', fontWeight: 700, color: '#3b82f6' }}>
                                    {avgPercentage}%
                                </div>
                                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 500 }}>Average</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}>
                                    {Math.round(maxPercentage)}%
                                </div>
                                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 500 }}>Highest</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '20px', fontWeight: 700, color: '#f59e0b' }}>
                                    {Math.round(minPercentage)}%
                                </div>
                                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 500 }}>Lowest</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    fontSize: '20px',
                                    fontWeight: 700,
                                    color: trend >= 0 ? '#10b981' : '#ef4444',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '2px',
                                }}>
                                    {trend >= 0 ? '↑' : '↓'}{Math.abs(Math.round(trend))}%
                                </div>
                                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 500 }}>Trend</div>
                            </div>
                        </div>

                        {/* Mini Bar Chart */}
                        <div style={{ padding: '20px' }}>
                            {history.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '40px 20px',
                                    color: '#94a3b8',
                                    fontSize: '13px',
                                }}>
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '12px', opacity: 0.5 }}>
                                        <path d="M3 3v18h18" />
                                        <path d="M18 17V9" />
                                        <path d="M13 17V5" />
                                        <path d="M8 17v-3" />
                                    </svg>
                                    <div>No exam history available yet</div>
                                </div>
                            ) : (
                                <>
                                    {/* Chart */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'flex-end',
                                        gap: '8px',
                                        height: '120px',
                                        marginBottom: '12px',
                                    }}>
                                        {history.slice(-8).map((item, index) => {
                                            const percentage = (item.score / item.maxScore) * 100;
                                            const barColor = percentage >= 75 ? '#10b981'
                                                : percentage >= 50 ? '#3b82f6'
                                                    : percentage >= 25 ? '#f59e0b'
                                                        : '#ef4444';

                                            return (
                                                <motion.div
                                                    key={index}
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${Math.max(percentage, 5)}%` }}
                                                    transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                                    style={{
                                                        flex: 1,
                                                        background: `linear-gradient(to top, ${barColor} 0%, ${barColor}80 100%)`,
                                                        borderRadius: '4px 4px 0 0',
                                                        minWidth: '24px',
                                                        position: 'relative',
                                                        cursor: 'pointer',
                                                    }}
                                                    whileHover={{ scale: 1.05 }}
                                                    title={`${item.examTitle}: ${item.score}/${item.maxScore} (${Math.round(percentage)}%)`}
                                                >
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '-20px',
                                                        left: '50%',
                                                        transform: 'translateX(-50%)',
                                                        fontSize: '9px',
                                                        fontWeight: 600,
                                                        color: barColor,
                                                        whiteSpace: 'nowrap',
                                                    }}>
                                                        {Math.round(percentage)}%
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>

                                    {/* Exam Labels */}
                                    <div style={{
                                        display: 'flex',
                                        gap: '8px',
                                    }}>
                                        {history.slice(-8).map((item, index) => (
                                            <div
                                                key={index}
                                                style={{
                                                    flex: 1,
                                                    fontSize: '8px',
                                                    color: '#94a3b8',
                                                    textAlign: 'center',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                                title={item.examTitle}
                                            >
                                                {item.examTitle.length > 8
                                                    ? item.examTitle.substring(0, 8) + '...'
                                                    : item.examTitle}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* History List */}
                        {history.length > 0 && (
                            <div style={{
                                padding: '0 20px 20px',
                                maxHeight: '200px',
                                overflowY: 'auto',
                            }}>
                                <div style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: '#64748b',
                                    marginBottom: '8px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                }}>
                                    Recent Exams
                                </div>
                                {history.slice().reverse().slice(0, 5).map((item, index) => {
                                    const percentage = (item.score / item.maxScore) * 100;
                                    const barColor = percentage >= 75 ? '#10b981'
                                        : percentage >= 50 ? '#3b82f6'
                                            : percentage >= 25 ? '#f59e0b'
                                                : '#ef4444';

                                    return (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '8px 12px',
                                                borderRadius: '8px',
                                                background: 'rgba(0,0,0,0.02)',
                                                marginBottom: '6px',
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontSize: '12px', fontWeight: 500, color: '#334155' }}>
                                                    {item.examTitle}
                                                </div>
                                                <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                                                    {new Date(item.date).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                            }}>
                                                <span style={{
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    color: '#64748b',
                                                }}>
                                                    {item.score}/{item.maxScore}
                                                </span>
                                                <span style={{
                                                    padding: '3px 8px',
                                                    borderRadius: '6px',
                                                    background: `${barColor}15`,
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    color: barColor,
                                                }}>
                                                    {Math.round(percentage)}%
                                                </span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

// ============================================
// STATISTICS COMPONENT - Philippine Grading System
// ============================================
const ScoreStatistics: React.FC<{
    scores: ExamScore[];
    maxScore: number;
    gradingSystem?: GradingSystem;
}> = ({ scores, maxScore, gradingSystem = 'sti' }) => {
    const stats = useMemo(() => {
        const validScores = scores.filter(s => s.score !== null).map(s => s.score as number);

        if (validScores.length === 0) {
            return {
                avg: 0,
                highest: 0,
                lowest: 0,
                passing: 0,
                entered: 0,
                total: scores.length,
                avgTransmuted: 0,
                avgGPA: 0,
                passingRate: 0,
                gradeDistribution: {},
            };
        }

        // Use Philippine grading system calculations
        const classStats = calculateClassStatistics(validScores, maxScore, gradingSystem);

        return {
            avg: classStats.average,
            highest: classStats.highest,
            lowest: classStats.lowest,
            passing: classStats.passingCount,
            entered: classStats.count,
            total: scores.length,
            avgTransmuted: classStats.averageTransmuted,
            avgGPA: classStats.averageGradePoint,
            passingRate: classStats.passingRate,
            gradeDistribution: classStats.gradeDistribution,
        };
    }, [scores, maxScore, gradingSystem]);

    const progressPercent = stats.total > 0 ? (stats.entered / stats.total) * 100 : 0;

    // Get color for average transmuted grade
    const avgGradeColor = getGradeColor(stats.avgTransmuted);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.06) 0%, rgba(59, 130, 246, 0.02) 100%)',
                borderRadius: '14px',
                padding: '16px 20px',
                border: '1px solid rgba(59, 130, 246, 0.12)',
            }}
        >
            {/* Entry Progress */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Entry Progress</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#3b82f6' }}>{stats.entered}/{stats.total}</span>
            </div>

            <div style={{ height: '6px', background: 'rgba(0,0,0,0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '16px' }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    style={{ height: '100%', background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)', borderRadius: '3px' }}
                />
            </div>

            {/* Raw Score Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                {[
                    { label: 'Raw Avg', value: stats.avg, color: '#3b82f6' },
                    { label: 'Highest', value: stats.highest, color: '#10b981' },
                    { label: 'Lowest', value: stats.lowest || '-', color: '#ef4444' },
                    { label: 'Passing', value: `${stats.passing}/${stats.entered}`, color: '#10b981' },
                ].map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        style={{ textAlign: 'center' }}
                    >
                        <div style={{ fontSize: '18px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* Philippine Grading Stats - Only show if there are scores */}
            {stats.entered > 0 && (
                <>
                    <div style={{
                        height: '1px',
                        background: 'rgba(0,0,0,0.06)',
                        margin: '12px 0',
                    }} />

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '12px',
                    }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                            <path d="M6 12v5c3 3 9 3 12 0v-5" />
                        </svg>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Philippine Grading ({gradingSystem.toUpperCase()})
                        </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                textAlign: 'center',
                                padding: '10px 8px',
                                borderRadius: '10px',
                                background: `${avgGradeColor}10`,
                                border: `1px solid ${avgGradeColor}20`,
                            }}
                        >
                            <div style={{ fontSize: '20px', fontWeight: 700, color: avgGradeColor }}>
                                {stats.avgTransmuted}
                            </div>
                            <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>
                                TRANSMUTED
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.05 }}
                            style={{
                                textAlign: 'center',
                                padding: '10px 8px',
                                borderRadius: '10px',
                                background: 'rgba(139, 92, 246, 0.08)',
                                border: '1px solid rgba(139, 92, 246, 0.15)',
                            }}
                        >
                            <div style={{ fontSize: '20px', fontWeight: 700, color: '#8b5cf6' }}>
                                {stats.avgGPA.toFixed(2)}
                            </div>
                            <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>
                                AVG GPA
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            style={{
                                textAlign: 'center',
                                padding: '10px 8px',
                                borderRadius: '10px',
                                background: stats.passingRate >= 75 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                                border: `1px solid ${stats.passingRate >= 75 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`,
                            }}
                        >
                            <div style={{
                                fontSize: '20px',
                                fontWeight: 700,
                                color: stats.passingRate >= 75 ? '#10b981' : '#ef4444',
                            }}>
                                {stats.passingRate}%
                            </div>
                            <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>
                                PASS RATE
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.15 }}
                            style={{
                                textAlign: 'center',
                                padding: '10px 8px',
                                borderRadius: '10px',
                                background: 'rgba(245, 158, 11, 0.08)',
                                border: '1px solid rgba(245, 158, 11, 0.15)',
                            }}
                        >
                            <div style={{ fontSize: '20px', fontWeight: 700, color: '#f59e0b' }}>
                                {stats.total - stats.entered}
                            </div>
                            <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>
                                PENDING
                            </div>
                        </motion.div>
                    </div>

                    {/* Grade Distribution */}
                    {Object.keys(stats.gradeDistribution).length > 0 && (
                        <div style={{ marginTop: '12px' }}>
                            <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '6px', fontWeight: 500 }}>
                                Grade Distribution
                            </div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {Object.entries(stats.gradeDistribution).map(([descriptor, count]) => (
                                    <span
                                        key={descriptor}
                                        style={{
                                            padding: '3px 8px',
                                            borderRadius: '6px',
                                            background: 'rgba(0,0,0,0.04)',
                                            fontSize: '11px',
                                            fontWeight: 500,
                                            color: '#64748b',
                                        }}
                                    >
                                        {descriptor}: <span style={{ fontWeight: 700, color: '#334155' }}>{count}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </motion.div>
    );
};

// ============================================
// ATTENDANCE SUMMARY COMPONENT
// ============================================
const AttendanceSummary: React.FC<{
    scores: ExamScore[];
    onExportReport?: () => void;
}> = ({ scores, onExportReport }) => {
    const attendanceStats = useMemo(() => {
        return calculateAttendanceFromScores(
            scores.map(s => ({
                studentId: s.studentId,
                studentName: s.studentName || '',
                isAbsent: s.isAbsent,
                isExcused: s.isExcused,
            }))
        );
    }, [scores]);

    // Don't show if no students
    if (scores.length === 0) return null;

    const { total, present, absent, excused, attendanceRate } = attendanceStats;

    // Determine attendance status color
    const getAttendanceColor = (rate: number) => {
        if (rate >= 90) return '#10b981'; // Excellent
        if (rate >= 80) return '#3b82f6'; // Good
        if (rate >= 70) return '#f59e0b'; // Warning
        return '#ef4444'; // Critical
    };

    const rateColor = getAttendanceColor(attendanceRate);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.06) 0%, rgba(139, 92, 246, 0.02) 100%)',
                borderRadius: '14px',
                padding: '16px 20px',
                border: '1px solid rgba(139, 92, 246, 0.12)',
                marginTop: '12px',
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                        Attendance Summary
                    </span>
                </div>
                {onExportReport && (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onExportReport}
                        style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid rgba(139, 92, 246, 0.2)',
                            background: 'rgba(139, 92, 246, 0.05)',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#8b5cf6',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                        }}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Export
                    </motion.button>
                )}
            </div>

            {/* Attendance Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {/* Present */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                        textAlign: 'center',
                        padding: '10px 8px',
                        borderRadius: '10px',
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.15)',
                    }}
                >
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}>
                        {present}
                    </div>
                    <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>
                        PRESENT
                    </div>
                </motion.div>

                {/* Absent */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 }}
                    style={{
                        textAlign: 'center',
                        padding: '10px 8px',
                        borderRadius: '10px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                    }}
                >
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#ef4444' }}>
                        {absent}
                    </div>
                    <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>
                        ABSENT
                    </div>
                </motion.div>

                {/* Excused */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    style={{
                        textAlign: 'center',
                        padding: '10px 8px',
                        borderRadius: '10px',
                        background: 'rgba(245, 158, 11, 0.08)',
                        border: '1px solid rgba(245, 158, 11, 0.15)',
                    }}
                >
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#f59e0b' }}>
                        {excused}
                    </div>
                    <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>
                        EXCUSED
                    </div>
                </motion.div>

                {/* Attendance Rate */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 }}
                    style={{
                        textAlign: 'center',
                        padding: '10px 8px',
                        borderRadius: '10px',
                        background: `${rateColor}10`,
                        border: `1px solid ${rateColor}20`,
                    }}
                >
                    <div style={{ fontSize: '20px', fontWeight: 700, color: rateColor }}>
                        {attendanceRate}%
                    </div>
                    <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>
                        RATE
                    </div>
                </motion.div>
            </div>

            {/* Attendance Bar */}
            <div style={{ marginTop: '12px' }}>
                <div style={{
                    height: '8px',
                    background: 'rgba(0,0,0,0.06)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    display: 'flex',
                }}>
                    {/* Present segment */}
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(present / total) * 100}%` }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            height: '100%',
                            background: '#10b981',
                        }}
                    />
                    {/* Excused segment */}
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(excused / total) * 100}%` }}
                        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            height: '100%',
                            background: '#f59e0b',
                        }}
                    />
                    {/* Absent segment */}
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(absent / total) * 100}%` }}
                        transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            height: '100%',
                            background: '#ef4444',
                        }}
                    />
                </div>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '16px',
                    marginTop: '8px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#10b981' }} />
                        <span style={{ fontSize: '10px', color: '#64748b' }}>Present</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#f59e0b' }} />
                        <span style={{ fontSize: '10px', color: '#64748b' }}>Excused</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#ef4444' }} />
                        <span style={{ fontSize: '10px', color: '#64748b' }}>Absent</span>
                    </div>
                </div>
            </div>

            {/* Warning for low attendance */}
            {attendanceRate < 80 && absent > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        marginTop: '12px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.06)',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 500 }}>
                        {absent} student{absent > 1 ? 's' : ''} absent - attendance below 80%
                    </span>
                </motion.div>
            )}
        </motion.div>
    );
};


// ============================================
// STUDENTS DATA - Fetched from Supabase (BSIT101A section)
// ============================================
// Students are now loaded dynamically from the database via getClassmates()
// The section is fixed to BSIT101A (40 real students from STI Meycauayan)

// ============================================
// ENHANCED SCORE INPUT WITH REF FORWARDING
// ============================================
const ScoreInputWithRef = React.forwardRef<
    HTMLInputElement,
    {
        value: number | null;
        maxScore: number;
        onChange: (value: number | null) => void;
        studentName: string;
        onKeyDown?: (e: React.KeyboardEvent) => void;
    }
>(({ value, maxScore, onChange, studentName, onKeyDown }, ref) => {
    const [localValue, setLocalValue] = useState(value?.toString() || '');
    const [error, setError] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        setLocalValue(value?.toString() || '');
        setError(null);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocalValue(val);

        if (val === '') {
            setError(null);
            onChange(null);
            return;
        }

        const numVal = parseFloat(val);
        if (isNaN(numVal)) {
            setError('Invalid');
        } else if (numVal < 0) {
            setError('Min: 0');
        } else if (numVal > maxScore) {
            setError(`Max: ${maxScore}`);
        } else {
            setError(null);
            onChange(numVal);
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            <input
                ref={ref}
                type="number"
                value={localValue}
                onChange={handleChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={onKeyDown}
                min={0}
                max={maxScore}
                step={0.5}
                aria-label={`Score for ${studentName}`}
                aria-invalid={!!error}
                style={{
                    width: '70px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: `1px solid ${error ? '#ef4444' : isFocused ? '#3b82f6' : 'rgba(0,0,0,0.08)'}`,
                    fontSize: '14px',
                    fontWeight: 500,
                    textAlign: 'center',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxShadow: isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
                    background: error ? 'rgba(239, 68, 68, 0.05)' : '#ffffff',
                }}
            />
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '10px',
                        color: '#ef4444',
                        marginTop: '2px',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {error}
                </motion.div>
            )}
        </div>
    );
});

ScoreInputWithRef.displayName = 'ScoreInputWithRef';

// ============================================
// MAIN MODAL COMPONENT
// ============================================
const InputScoresModal: React.FC<InputScoresModalProps> = ({ isOpen, onClose, onSave }) => {
    // State
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [selectedExam, setSelectedExam] = useState<string>('');
    const [selectedSection, setSelectedSection] = useState<string>('BSIT101A'); // Fixed to BSIT101A
    const [scores, setScores] = useState<ExamScore[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    // Students state - fetched from Supabase
    const [students, setStudents] = useState<Student[]>([]);

    // Exams state - fetched from Supabase
    const [exams, setExams] = useState<Exam[]>([]);
    const [isLoadingExams, setIsLoadingExams] = useState(false);

    // Exam history state - for "Copy from Previous Exam" feature
    const [examHistory, setExamHistory] = useState<ExamHistoryItem[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Import state
    const [showImportPreview, setShowImportPreview] = useState(false);
    const [importedData, setImportedData] = useState<ImportedRow[]>([]);

    // Copy from previous exam state
    const [showCopyModal, setShowCopyModal] = useState(false);

    // Apply curve state
    const [showCurveModal, setShowCurveModal] = useState(false);

    // Grade weighting state
    const [gradeWeightConfig, setGradeWeightConfig] = useState<GradeWeightConfig>({ enabled: false, weights: [] });
    const [showWeightModal, setShowWeightModal] = useState(false);

    // Toolbar visibility state
    const [hideToolbar, setHideToolbar] = useState(false);

    // Bulk selection state
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [bulkSelectionMode, setBulkSelectionMode] = useState(false);

    // Audit log state
    const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
    const [showAuditModal, setShowAuditModal] = useState(false);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');

    // Grading system state (Philippine grading)
    const [gradingSystem, setGradingSystem] = useState<GradingSystem>('sti');

    // Confirmation dialog state
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [saveWarningMessage, setSaveWarningMessage] = useState('');
    const saveConfirmGoBackRef = useRef<HTMLButtonElement>(null);

    // Save status toast state
    const [saveStatus, setSaveStatus] = useState<{
        show: boolean;
        type: 'success' | 'error';
        message: string;
    }>({ show: false, type: 'success', message: '' });
    const saveStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Undo state - stores previous scores for undo functionality
    const [scoresHistory, setScoresHistory] = useState<ExamScore[][]>([]);
    const [canUndo, setCanUndo] = useState(false);

    // Auto-save state
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

    // Draft mode state - distinguishes between draft saves and final submissions
    const [isDraft, setIsDraft] = useState(true);
    const [lastDraftSave, setLastDraftSave] = useState<Date | null>(null);

    // Student score history state - for mini charts
    const [studentScoreHistory, setStudentScoreHistory] = useState<Record<string, { examTitle: string; score: number; maxScore: number; date: string }[]>>({});
    const [showScoreHistoryModal, setShowScoreHistoryModal] = useState(false);
    const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<{ id: string; name: string } | null>(null);

    // Get current exam from exams state
    const currentExam = useMemo(() =>
        exams.find(e => e.id === selectedExam),
        [exams, selectedExam]
    );

    // Get filtered students by search query (section is fixed to BSIT101A)
    const filteredStudents = useMemo(() => {
        let filtered = students;

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(s =>
                s.name.toLowerCase().includes(query) ||
                s.studentId.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [students, searchQuery]);

    // Section is fixed to BSIT101A only
    const sections = useMemo(() => {
        return [{ id: 'BSIT101A', label: 'BSIT101A' }];
    }, []);

    // Focus management - save previous focus and restore on close
    useEffect(() => {
        if (isOpen) {
            previousActiveElement.current = document.activeElement as HTMLElement;
            // Focus the close button when modal opens
            setTimeout(() => {
                closeButtonRef.current?.focus();
            }, 100);
        } else {
            // Restore focus when modal closes
            previousActiveElement.current?.focus();
        }
    }, [isOpen]);

    // Handle Escape key to close modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && !showImportPreview && !showCopyModal && !showCurveModal && !showWeightModal && !showAuditModal && !showSaveConfirm) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, showImportPreview, showCopyModal, showCurveModal, showSaveConfirm]);

    // Trap focus within modal
    useEffect(() => {
        if (!isOpen || !modalRef.current) return;

        const modal = modalRef.current;
        const focusableElements = modal.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleTabKey = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        modal.addEventListener('keydown', handleTabKey);
        return () => modal.removeEventListener('keydown', handleTabKey);
    }, [isOpen, selectedExam]);

    // Load courses on mount
    useEffect(() => {
        const loadCourses = async () => {
            setIsLoading(true);
            try {
                const catalogCourses = await getCatalogCourses();
                if (catalogCourses.length > 0) {
                    setCourses(catalogCourses.map(c => ({
                        id: c.id,
                        title: c.title,
                        shortTitle: c.shortTitle,
                    })));
                } else {
                    // Fallback demo courses
                    setCourses([
                        { id: 'cp1', title: 'Computer Programming 1', shortTitle: 'CP1' },
                        { id: 'itc', title: 'Introduction to Computing', shortTitle: 'ITC' },
                        { id: 'euth1', title: 'Euthenics 1', shortTitle: 'EUTH1' },
                    ]);
                }
            } catch (error) {
                console.error('Failed to load courses:', error);
                setCourses([
                    { id: 'cp1', title: 'Computer Programming 1', shortTitle: 'CP1' },
                    { id: 'itc', title: 'Introduction to Computing', shortTitle: 'ITC' },
                    { id: 'euth1', title: 'Euthenics 1', shortTitle: 'EUTH1' },
                ]);
            }
            setIsLoading(false);
        };
        if (isOpen) loadCourses();
    }, [isOpen]);

    // Load students from Supabase (BSIT101A section)
    useEffect(() => {
        const loadStudents = async () => {
            setIsLoadingStudents(true);
            try {
                const classmates = await getClassmates('BSIT101A');
                // Transform UserAccount to Student format
                const studentList: Student[] = classmates.map((user: UserAccount) => ({
                    id: user.id,
                    name: user.full_name,
                    studentId: user.student_id,
                    section: user.section || 'BSIT101A',
                }));
                setStudents(studentList);
            } catch (error) {
                console.error('Failed to load students:', error);
                // No fallback - show empty state
                setStudents([]);
            }
            setIsLoadingStudents(false);
        };
        if (isOpen) loadStudents();
    }, [isOpen]);

    // Load exams when course is selected
    useEffect(() => {
        const loadExams = async () => {
            if (!selectedCourse) {
                setExams([]);
                setSelectedExam('');
                return;
            }

            setIsLoadingExams(true);
            try {
                const courseExams = await getExamsByCourse(selectedCourse);
                // Transform to local Exam format
                const examList: Exam[] = courseExams.map(e => ({
                    id: e.id,
                    title: e.title,
                    maxScore: e.max_score,
                    date: e.exam_date,
                    courseId: e.course_id,
                }));
                setExams(examList);
                // Reset selected exam when course changes
                setSelectedExam('');
            } catch (error) {
                console.error('Failed to load exams:', error);
                setExams([]);
            }
            setIsLoadingExams(false);
        };
        loadExams();
    }, [selectedCourse]);

    // Load exam history when opening copy modal
    useEffect(() => {
        const loadHistory = async () => {
            if (!showCopyModal || !selectedCourse) return;

            setIsLoadingHistory(true);
            try {
                const history = await getExamHistory(selectedCourse, selectedExam);
                setExamHistory(history);
            } catch (error) {
                console.error('Failed to load exam history:', error);
                setExamHistory([]);
            }
            setIsLoadingHistory(false);
        };
        loadHistory();
    }, [showCopyModal, selectedCourse, selectedExam]);

    // Initialize scores when exam is selected - load existing scores from database
    useEffect(() => {
        const initializeScores = async () => {
            if (!selectedExam || filteredStudents.length === 0) return;

            // First, initialize all students with null scores
            const initialScores: ExamScore[] = filteredStudents.map(student => ({
                studentId: student.studentId,
                studentName: student.name,
                score: null,
                remarks: '',
                isAbsent: false,
                isExcused: false,
            }));

            // Then try to load existing scores from database/localStorage
            try {
                const existingScores = await getExamScores(selectedExam);

                if (existingScores.length > 0) {
                    // Merge existing scores with student list
                    const mergedScores = initialScores.map(s => {
                        const existing = existingScores.find(e => e.student_id === s.studentId);
                        if (existing) {
                            return {
                                ...s,
                                score: existing.score,
                                remarks: existing.remarks || '',
                                isAbsent: existing.is_absent || false,
                                isExcused: existing.is_excused || false,
                            };
                        }
                        return s;
                    });
                    setScores(mergedScores);
                    console.log('[InputScores] Loaded existing scores:', existingScores.length);
                } else {
                    setScores(initialScores);
                }
            } catch (error) {
                console.error('Failed to load existing scores:', error);
                setScores(initialScores);
            }
        };

        initializeScores();
    }, [selectedExam, filteredStudents]);

    // Save current scores to history before making changes
    const saveToHistory = useCallback(() => {
        setScoresHistory(prev => {
            const newHistory = [...prev, scores];
            // Keep only last 10 states to prevent memory issues
            if (newHistory.length > 10) {
                return newHistory.slice(-10);
            }
            return newHistory;
        });
        setCanUndo(true);
    }, [scores]);

    // Undo last action
    const handleUndo = useCallback(() => {
        if (scoresHistory.length === 0) return;

        const previousScores = scoresHistory[scoresHistory.length - 1];
        setScores(previousScores);
        setScoresHistory(prev => prev.slice(0, -1));
        setCanUndo(scoresHistory.length > 1);
    }, [scoresHistory]);

    // Add entry to audit log
    const addAuditEntry = useCallback((
        action: AuditAction,
        studentId?: string,
        studentName?: string,
        previousValue?: string | number | null,
        newValue?: string | number | null,
        details?: string
    ) => {
        const entry: AuditLogEntry = {
            id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            action,
            userId: 'TEACHER001',
            userName: 'Teacher',
            studentId,
            studentName,
            previousValue,
            newValue,
            details,
        };
        setAuditLog(prev => [entry, ...prev]);
    }, []);

    // Toggle student selection
    const toggleStudentSelection = useCallback((studentId: string) => {
        setSelectedStudents(prev => {
            const newSet = new Set(prev);
            if (newSet.has(studentId)) {
                newSet.delete(studentId);
            } else {
                newSet.add(studentId);
            }
            return newSet;
        });
    }, []);

    // Select all students
    const selectAllStudents = useCallback(() => {
        setSelectedStudents(new Set(filteredStudents.map(s => s.studentId)));
    }, [filteredStudents]);

    // Clear selection
    const clearSelection = useCallback(() => {
        setSelectedStudents(new Set());
    }, []);

    // Bulk mark as absent
    const bulkMarkAbsent = useCallback(() => {
        if (selectedStudents.size === 0) return;
        saveToHistory();

        setScores(prev => prev.map(s => {
            if (!selectedStudents.has(s.studentId)) return s;
            addAuditEntry('marked_absent', s.studentId, s.studentName, s.isAbsent ? 'Absent' : 'Present', 'Absent', 'Bulk action');
            return { ...s, isAbsent: true, isExcused: false, score: null };
        }));

        setHasUnsavedChanges(true);
        clearSelection();
        setBulkSelectionMode(false);
    }, [selectedStudents, saveToHistory, addAuditEntry, clearSelection]);

    // Bulk mark as excused
    const bulkMarkExcused = useCallback(() => {
        if (selectedStudents.size === 0) return;
        saveToHistory();

        setScores(prev => prev.map(s => {
            if (!selectedStudents.has(s.studentId)) return s;
            addAuditEntry('marked_excused', s.studentId, s.studentName, s.isAbsent ? 'Absent' : 'Present', 'Excused', 'Bulk action');
            return { ...s, isAbsent: true, isExcused: true, score: null };
        }));

        setHasUnsavedChanges(true);
        clearSelection();
        setBulkSelectionMode(false);
    }, [selectedStudents, saveToHistory, addAuditEntry, clearSelection]);

    // Bulk mark as present
    const bulkMarkPresent = useCallback(() => {
        if (selectedStudents.size === 0) return;
        saveToHistory();

        setScores(prev => prev.map(s => {
            if (!selectedStudents.has(s.studentId)) return s;
            addAuditEntry('marked_present', s.studentId, s.studentName, s.isAbsent ? 'Absent' : 'Present', 'Present', 'Bulk action');
            return { ...s, isAbsent: false, isExcused: false };
        }));

        setHasUnsavedChanges(true);
        clearSelection();
        setBulkSelectionMode(false);
    }, [selectedStudents, saveToHistory, addAuditEntry, clearSelection]);

    // Mark ALL students as present (quick action - no selection needed)
    const markAllPresent = useCallback(() => {
        saveToHistory();

        const absentCount = scores.filter(s => s.isAbsent).length;

        setScores(prev => prev.map(s => {
            if (!s.isAbsent) return s; // Already present
            addAuditEntry('marked_present', s.studentId, s.studentName, s.isExcused ? 'Excused' : 'Absent', 'Present', 'Mark all present');
            return { ...s, isAbsent: false, isExcused: false };
        }));

        setHasUnsavedChanges(true);

        // Show feedback using setSaveStatus directly
        const message = absentCount > 0
            ? `Marked ${absentCount} student${absentCount !== 1 ? 's' : ''} as present`
            : 'All students are already marked present';
        setSaveStatus({ show: true, type: 'success', message });

        // Auto-hide after 3 seconds
        if (saveStatusTimeoutRef.current) {
            clearTimeout(saveStatusTimeoutRef.current);
        }
        saveStatusTimeoutRef.current = setTimeout(() => {
            setSaveStatus(prev => ({ ...prev, show: false }));
        }, 3000);
    }, [scores, saveToHistory, addAuditEntry]);

    // Bulk fill score
    const bulkFillScore = useCallback((value: number) => {
        if (selectedStudents.size === 0) return;
        saveToHistory();

        setScores(prev => prev.map(s => {
            if (!selectedStudents.has(s.studentId)) return s;
            if (s.isAbsent) return s; // Don't fill absent students
            addAuditEntry('score_entered', s.studentId, s.studentName, s.score, value, 'Bulk action');
            return { ...s, score: value };
        }));

        setHasUnsavedChanges(true);
        clearSelection();
        setBulkSelectionMode(false);
    }, [selectedStudents, saveToHistory, addAuditEntry, clearSelection]);

    // Handle score change with audit
    const handleScoreChange = useCallback((studentId: string, score: number | null) => {
        const currentScore = scores.find(s => s.studentId === studentId);
        if (currentScore && currentScore.score !== score) {
            const studentName = currentScore.studentName || students.find(s => s.studentId === studentId)?.name;
            addAuditEntry(
                currentScore.score === null ? 'score_entered' : 'score_updated',
                studentId,
                studentName,
                currentScore.score,
                score
            );
        }
        setScores(prev => prev.map(s =>
            s.studentId === studentId ? { ...s, score } : s
        ));
        setHasUnsavedChanges(true); // Mark as having unsaved changes
    }, [scores, students, addAuditEntry]);

    // Handle attendance status change with audit
    const handleAttendanceChange = useCallback((studentId: string, status: AttendanceStatus) => {
        const currentScore = scores.find(s => s.studentId === studentId);
        const studentName = currentScore?.studentName || students.find(s => s.studentId === studentId)?.name;
        const previousStatus = currentScore?.isAbsent ? (currentScore?.isExcused ? 'Excused' : 'Absent') : 'Present';

        const action: AuditAction = status === 'absent' ? 'marked_absent'
            : status === 'excused' ? 'marked_excused'
                : 'marked_present';

        addAuditEntry(action, studentId, studentName, previousStatus, status === 'present' ? 'Present' : status === 'excused' ? 'Excused' : 'Absent');

        setScores(prev => prev.map(s => {
            if (s.studentId !== studentId) return s;

            const isAbsent = status === 'absent' || status === 'excused';
            const isExcused = status === 'excused';

            return {
                ...s,
                isAbsent,
                isExcused,
                // Clear score if marking as absent
                score: isAbsent ? null : s.score,
            };
        }));
        setHasUnsavedChanges(true);
    }, [scores, students, addAuditEntry]);

    // Handle Enter key to move to next input
    const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
        if (e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey)) {
            e.preventDefault();
            const nextInput = inputRefs.current[index + 1];
            if (nextInput) {
                nextInput.focus();
                nextInput.select();
            }
        }
    }, []);

    // Fill all empty scores with a value
    const handleFillAll = useCallback((value: number) => {
        saveToHistory();
        setScores(prev => prev.map(s => ({
            ...s,
            score: s.score === null ? value : s.score,
        })));
    }, [saveToHistory]);

    // Clear all scores
    const handleClearAll = useCallback(() => {
        saveToHistory();
        setScores(prev => prev.map(s => ({ ...s, score: null })));
    }, [saveToHistory]);

    // Handle CSV file import
    const handleFileImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const rows = parseCSV(text);

            // Skip header row, assume format: StudentID, Name, Score
            const dataRows = rows.slice(1);

            const imported: ImportedRow[] = dataRows
                .filter(row => row.length >= 2) // At least ID and name
                .map(row => {
                    const studentId = row[0]?.trim() || '';
                    const studentName = row[1]?.trim() || '';
                    const scoreStr = row[2]?.trim() || '';
                    const score = scoreStr === '' ? null : parseFloat(scoreStr);

                    // Try to match with existing students from database
                    const matchedStudent = students.find(s =>
                        s.studentId.toLowerCase() === studentId.toLowerCase() ||
                        s.name.toLowerCase() === studentName.toLowerCase()
                    );

                    return {
                        studentId,
                        studentName,
                        score: isNaN(score as number) ? null : score,
                        matched: !!matchedStudent,
                        matchedStudentId: matchedStudent?.studentId, // Use studentId for database matching
                    };
                });

            setImportedData(imported);
            setShowImportPreview(true);
        };
        reader.readAsText(file);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    // Handle import confirmation
    const handleImportConfirm = useCallback((data: ImportedRow[]) => {
        saveToHistory();
        // Apply imported scores to the scores state
        setScores(prev => {
            const newScores = [...prev];
            data.forEach(row => {
                if (row.matched && row.matchedStudentId) {
                    const index = newScores.findIndex(s => s.studentId === row.matchedStudentId);
                    if (index !== -1) {
                        newScores[index] = { ...newScores[index], score: row.score };
                    }
                }
            });
            return newScores;
        });
        setShowImportPreview(false);
        setImportedData([]);
    }, []);

    // Handle copy from previous exam
    const handleCopyFromExam = useCallback((examHistory: ExamHistoryItem) => {
        saveToHistory();
        setScores(prev => {
            const newScores = [...prev];
            examHistory.studentScores.forEach(({ studentId, score }) => {
                const index = newScores.findIndex(s => s.studentId === studentId);
                if (index !== -1) {
                    newScores[index] = { ...newScores[index], score };
                }
            });
            return newScores;
        });
        setShowCopyModal(false);
    }, [saveToHistory]);

    // Handle apply curve
    const handleApplyCurve = useCallback((adjustment: number, method: 'percentage' | 'points') => {
        saveToHistory();
        const maxScoreValue = currentExam?.maxScore || 100;
        setScores(prev => prev.map(s => {
            if (s.score === null) return s;

            let newScore: number;
            if (method === 'percentage') {
                newScore = s.score * (1 + adjustment / 100);
            } else {
                newScore = s.score + adjustment;
            }

            // Cap at max score and floor at 0
            newScore = Math.max(0, Math.min(newScore, maxScoreValue));
            newScore = Math.round(newScore * 10) / 10; // Round to 1 decimal

            return { ...s, score: newScore };
        }));
        setShowCurveModal(false);
    }, [saveToHistory, currentExam?.maxScore]);

    // Helper to show save status toast
    const showSaveStatus = useCallback((type: 'success' | 'error', message: string) => {
        // Clear any existing timeout
        if (saveStatusTimeoutRef.current) {
            clearTimeout(saveStatusTimeoutRef.current);
        }

        setSaveStatus({ show: true, type, message });

        // Auto-hide after 4 seconds for success, 6 seconds for error
        saveStatusTimeoutRef.current = setTimeout(() => {
            setSaveStatus(prev => ({ ...prev, show: false }));
        }, type === 'success' ? 4000 : 6000);
    }, []);

    // Export to CSV (Excel)
    const handleExportCSV = useCallback(() => {
        if (!selectedExam || !currentExam) return;

        const selectedCourseData = courses.find(c => c.id === selectedCourse);

        const exportData: ExportScoreData[] = scores.map(s => ({
            studentId: s.studentId,
            studentName: s.studentName || '',
            section: selectedSection,
            score: s.score,
            isAbsent: s.isAbsent,
            isExcused: s.isExcused,
            remarks: s.remarks,
        }));

        const exportOptions: ExportOptions = {
            examTitle: currentExam.title,
            courseTitle: selectedCourseData ? `${selectedCourseData.shortTitle} - ${selectedCourseData.title}` : 'Unknown Course',
            maxScore: currentExam.maxScore,
            gradingSystem,
            exportDate: new Date(),
            teacherName: 'Instructor',
        };

        downloadCSV(exportData, exportOptions);
        showSaveStatus('success', 'Scores exported to Excel (CSV) successfully!');
    }, [selectedExam, currentExam, courses, selectedCourse, scores, selectedSection, gradingSystem, showSaveStatus]);

    // Export to PDF (Print View)
    const handleExportPDF = useCallback(() => {
        if (!selectedExam || !currentExam) return;

        const selectedCourseData = courses.find(c => c.id === selectedCourse);

        const exportData: ExportScoreData[] = scores.map(s => ({
            studentId: s.studentId,
            studentName: s.studentName || '',
            section: selectedSection,
            score: s.score,
            isAbsent: s.isAbsent,
            isExcused: s.isExcused,
            remarks: s.remarks,
        }));

        const exportOptions: ExportOptions = {
            examTitle: currentExam.title,
            courseTitle: selectedCourseData ? `${selectedCourseData.shortTitle} - ${selectedCourseData.title}` : 'Unknown Course',
            maxScore: currentExam.maxScore,
            gradingSystem,
            exportDate: new Date(),
            teacherName: 'Instructor',
        };

        openPrintView(exportData, exportOptions);
    }, [selectedExam, currentExam, courses, selectedCourse, scores, selectedSection, gradingSystem]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveStatusTimeoutRef.current) {
                clearTimeout(saveStatusTimeoutRef.current);
            }
        };
    }, []);

    // Save scores to Supabase
    const handleSave = async (asDraft: boolean = false) => {
        if (!selectedExam) return;

        setIsSaving(true);
        const examTitle = currentExam?.title || 'exam';

        try {
            // Prepare scores for saving (including attendance and draft status)
            const scoresToSave = scores.map(s => ({
                studentId: s.studentId,
                studentName: s.studentName || '',
                score: s.score,
                remarks: s.remarks,
                isAbsent: s.isAbsent || false,
                isExcused: s.isExcused || false,
            }));

            // Save to Supabase using the exams service
            const result = await saveExamScores(selectedExam, scoresToSave);

            if (!result.success) {
                throw new Error(result.error || 'Failed to save scores');
            }

            // Sync attendance records
            await syncAttendanceFromExamScores(
                selectedExam,
                selectedCourse,
                currentExam?.date || new Date().toISOString().split('T')[0],
                scoresToSave.map(s => ({
                    studentId: s.studentId,
                    studentName: s.studentName,
                    section: selectedSection,
                    isAbsent: s.isAbsent,
                    isExcused: s.isExcused,
                }))
            );

            // Also call the optional onSave callback if provided
            if (onSave) {
                await onSave(selectedExam, scores);
            }

            // Reset unsaved changes flag
            setHasUnsavedChanges(false);

            if (asDraft) {
                // Draft save - don't close modal
                setLastDraftSave(new Date());
                setIsDraft(true);
                showSaveStatus(
                    'success',
                    `📝 Draft saved! ${result.savedCount} score${result.savedCount !== 1 ? 's' : ''} for "${examTitle}"`
                );
            } else {
                // Final save - close modal
                setLastAutoSave(new Date());
                setIsDraft(false);
                showSaveStatus(
                    'success',
                    `✅ Finalized! ${result.savedCount} score${result.savedCount !== 1 ? 's' : ''} for "${examTitle}"`
                );

                // Close modal after a brief delay to show success message
                setTimeout(() => {
                    onClose();
                }, 1500);
            }

        } catch (error) {
            console.error('Failed to save scores:', error);

            // Show error toast with helpful message
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            showSaveStatus(
                'error',
                `Failed to save scores: ${errorMessage}. Please try again.`
            );
        } finally {
            setIsSaving(false);
        }
    };

    // Auto-save function (silent save without closing modal)
    const performAutoSave = useCallback(async () => {
        if (!selectedExam || !hasUnsavedChanges || isAutoSaving || isSaving) return;

        // Only auto-save if there are actual scores entered
        const hasScores = scores.some(s => s.score !== null || s.isAbsent);
        if (!hasScores) return;

        setIsAutoSaving(true);

        try {
            const scoresToSave = scores.map(s => ({
                studentId: s.studentId,
                studentName: s.studentName || '',
                score: s.score,
                remarks: s.remarks,
                isAbsent: s.isAbsent || false,
                isExcused: s.isExcused || false,
            }));

            const result = await saveExamScores(selectedExam, scoresToSave);

            if (result.success) {
                setHasUnsavedChanges(false);
                setLastAutoSave(new Date());
                console.log('[AutoSave] Saved', result.savedCount, 'scores at', new Date().toLocaleTimeString());
            }
        } catch (error) {
            console.error('[AutoSave] Failed:', error);
            // Don't show error toast for auto-save failures - just log it
        } finally {
            setIsAutoSaving(false);
        }
    }, [selectedExam, hasUnsavedChanges, isAutoSaving, isSaving, scores]);

    // Auto-save timer effect
    useEffect(() => {
        if (!isOpen || !selectedExam) {
            // Clear interval when modal closes or no exam selected
            if (autoSaveIntervalRef.current) {
                clearInterval(autoSaveIntervalRef.current);
                autoSaveIntervalRef.current = null;
            }
            return;
        }

        // Set up auto-save interval
        autoSaveIntervalRef.current = setInterval(() => {
            performAutoSave();
        }, AUTO_SAVE_INTERVAL);

        // Cleanup on unmount or when dependencies change
        return () => {
            if (autoSaveIntervalRef.current) {
                clearInterval(autoSaveIntervalRef.current);
                autoSaveIntervalRef.current = null;
            }
        };
    }, [isOpen, selectedExam, performAutoSave]);

    // Save before closing if there are unsaved changes
    useEffect(() => {
        if (!isOpen && hasUnsavedChanges && selectedExam) {
            performAutoSave();
        }
    }, [isOpen, hasUnsavedChanges, selectedExam, performAutoSave]);

    // Validate and initiate save (with confirmation if needed)
    const handleSaveClick = useCallback((asDraft: boolean = false) => {
        if (!selectedExam) return;

        const emptyCount = scores.filter(s => s.score === null && !s.isAbsent).length;
        const absentCount = scores.filter(s => s.isAbsent).length;
        const zeroScoreCount = scores.filter(s => s.score === 0 && !s.isAbsent).length;
        const totalCount = scores.length;
        const presentCount = totalCount - absentCount;

        // Build detailed warning messages
        const warnings: string[] = [];

        if (emptyCount === presentCount && presentCount > 0) {
            warnings.push(`⚠️ All ${presentCount} present students have no scores entered.`);
        } else if (emptyCount > 0) {
            const percentage = Math.round((emptyCount / presentCount) * 100);
            warnings.push(`⚠️ ${emptyCount} student${emptyCount !== 1 ? 's' : ''} (${percentage}%) have no scores entered.`);
        }

        if (zeroScoreCount > 0) {
            warnings.push(`📊 ${zeroScoreCount} student${zeroScoreCount !== 1 ? 's' : ''} have a score of 0.`);
        }

        if (absentCount > 0) {
            warnings.push(`🚫 ${absentCount} student${absentCount !== 1 ? 's are' : ' is'} marked absent/excused.`);
        }

        // If saving as draft, be more lenient
        if (asDraft) {
            setIsDraft(true);
            if (warnings.length > 0 && emptyCount === presentCount) {
                setSaveWarningMessage(
                    `Saving as Draft\n\n${warnings.join('\n')}\n\nDrafts can be edited later. Continue?`
                );
                setShowSaveConfirm(true);
            } else {
                handleSave(true); // Save as draft directly
            }
        } else {
            // Final save - show all warnings
            setIsDraft(false);
            if (warnings.length > 0) {
                setSaveWarningMessage(
                    `Final Submission Review\n\n${warnings.join('\n')}\n\n⚡ This will finalize the scores. Continue?`
                );
                setShowSaveConfirm(true);
            } else {
                handleSave(false); // All good, save directly
            }
        }
    }, [selectedExam, scores]);

    // Handle save as draft (quick save)
    const handleSaveDraft = useCallback(() => {
        handleSaveClick(true);
    }, [handleSaveClick]);

    // Confirm save after warning
    const handleConfirmSave = useCallback(() => {
        setShowSaveConfirm(false);
        handleSave(isDraft);
    }, [isDraft]);

    // Course options for dropdown
    const courseOptions = useMemo(() =>
        courses.map(c => ({ id: c.id, label: `${c.shortTitle} - ${c.title}` })),
        [courses]
    );

    // Exam options for dropdown (from Supabase)
    const examOptions = useMemo(() =>
        exams.map(e => ({ id: e.id, label: `${e.title} (${e.maxScore} pts)` })),
        [exams]
    );

    // Modal content
    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="input-scores-title"
                    aria-describedby="input-scores-description"
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15, 23, 42, 0.6)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: '20px',
                    }}
                >
                    <motion.div
                        ref={modalRef}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        onClick={(e) => e.stopPropagation()}
                        role="document"
                        style={{
                            width: '100%',
                            maxWidth: '900px',
                            maxHeight: '85vh',
                            background: '#ffffff',
                            borderRadius: '20px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '20px 24px',
                            borderBottom: '1px solid rgba(0,0,0,0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }} aria-hidden="true">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 11l3 3L22 4" />
                                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 id="input-scores-title" style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                                        Input Exam Scores
                                    </h2>
                                    <p id="input-scores-description" style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                                        Enter scores for students
                                    </p>
                                </div>
                            </div>
                            <motion.button
                                ref={closeButtonRef}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onClose}
                                aria-label="Close input scores modal"
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: 'rgba(0,0,0,0.04)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" aria-hidden="true">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </motion.button>
                        </div>

                        {/* Dropdowns Row */}
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                            <div style={{ display: 'flex', gap: '12px', marginBottom: selectedExam ? '12px' : 0 }}>
                                <CustomDropdown
                                    label="Course"
                                    value={selectedCourse}
                                    options={courseOptions}
                                    onChange={(v) => { setSelectedCourse(v); setSelectedExam(''); }}
                                    placeholder="Select a course"
                                    isLoading={isLoading}
                                />
                                <CustomDropdown
                                    label="Exam"
                                    value={selectedExam}
                                    options={examOptions}
                                    onChange={setSelectedExam}
                                    placeholder="Select an exam"
                                    disabled={!selectedCourse}
                                    isLoading={isLoadingExams}
                                />
                            </div>
                            {selectedExam && (
                                <>
                                    {/* Row 1: Filters */}
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                        <div style={{ width: '160px' }}>
                                            <CustomDropdown
                                                label="Section"
                                                value={selectedSection}
                                                options={sections}
                                                onChange={setSelectedSection}
                                                placeholder="Filter by section"
                                            />
                                        </div>
                                        {/* Search Input */}
                                        <div style={{ flex: 1, minWidth: '200px' }}>
                                            <label
                                                htmlFor="student-search-input"
                                                style={{
                                                    display: 'block',
                                                    fontSize: '12px',
                                                    fontWeight: 500,
                                                    color: '#64748b',
                                                    marginBottom: '8px',
                                                }}
                                            >
                                                Search
                                            </label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    id="student-search-input"
                                                    type="text"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    placeholder="Name or ID..."
                                                    aria-label="Search students by name or ID"
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px 14px',
                                                        paddingLeft: '36px',
                                                        borderRadius: '12px',
                                                        border: '1px solid rgba(0,0,0,0.08)',
                                                        fontSize: '14px',
                                                        fontWeight: 500,
                                                        outline: 'none',
                                                        transition: 'all 0.2s ease',
                                                    }}
                                                    onFocus={(e) => {
                                                        e.target.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                                                        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                                    }}
                                                    onBlur={(e) => {
                                                        e.target.style.borderColor = 'rgba(0,0,0,0.08)';
                                                        e.target.style.boxShadow = 'none';
                                                    }}
                                                />
                                                <svg
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="#94a3b8"
                                                    strokeWidth="2"
                                                    style={{
                                                        position: 'absolute',
                                                        left: '12px',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                    }}
                                                >
                                                    <circle cx="11" cy="11" r="8" />
                                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                                </svg>
                                                {searchQuery && (
                                                    <motion.button
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => setSearchQuery('')}
                                                        aria-label="Clear search"
                                                        style={{
                                                            position: 'absolute',
                                                            right: '10px',
                                                            top: '50%',
                                                            transform: 'translateY(-50%)',
                                                            width: '18px',
                                                            height: '18px',
                                                            borderRadius: '50%',
                                                            border: 'none',
                                                            background: 'rgba(0,0,0,0.06)',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}
                                                    >
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="3" aria-hidden="true">
                                                            <line x1="18" y1="6" x2="6" y2="18" />
                                                            <line x1="6" y1="6" x2="18" y2="18" />
                                                        </svg>
                                                    </motion.button>
                                                )}
                                            </div>
                                        </div>
                                        {/* Hide Tools Toggle Button - Inline */}
                                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                                            <label
                                                style={{
                                                    display: 'block',
                                                    fontSize: '12px',
                                                    fontWeight: 500,
                                                    color: '#64748b',
                                                    marginBottom: '8px',
                                                    visibility: 'hidden',
                                                }}
                                            >
                                                Tools
                                            </label>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setHideToolbar(!hideToolbar)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    padding: '12px 14px',
                                                    borderRadius: '12px',
                                                    border: '1px solid rgba(0,0,0,0.08)',
                                                    background: hideToolbar ? 'rgba(59, 130, 246, 0.08)' : 'rgba(0,0,0,0.02)',
                                                    fontSize: '13px',
                                                    fontWeight: 600,
                                                    color: hideToolbar ? '#3b82f6' : '#64748b',
                                                    cursor: 'pointer',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                <motion.svg
                                                    width="14"
                                                    height="14"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    animate={{ rotate: hideToolbar ? 180 : 0 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <polyline points="6 9 12 15 18 9" />
                                                </motion.svg>
                                                {hideToolbar ? 'Show Tools' : 'Hide Tools'}
                                            </motion.button>
                                        </div>
                                        {/* Grading System Selector */}
                                        <div style={{ width: '160px' }}>
                                            <CustomDropdown
                                                label="Grading"
                                                value={gradingSystem}
                                                options={[
                                                    { id: 'sti', label: 'STI (1.0-5.0)' },
                                                    { id: 'deped', label: 'DepEd K-12' },
                                                    { id: 'ched', label: 'CHED Standard' },
                                                ]}
                                                onChange={(v) => setGradingSystem(v as GradingSystem)}
                                                placeholder="Select system"
                                            />
                                        </div>
                                    </div>

                                    {/* Collapsible Toolbar Section */}
                                    <AnimatePresence>
                                        {!hideToolbar && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.2 }}
                                                style={{ overflow: 'hidden' }}
                                            >
                                                {/* Row 2: Primary Actions (4 buttons) */}
                                                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }} role="toolbar" aria-label="Primary actions">
                                                    {/* Undo Button */}
                                                    <motion.button
                                                        whileHover={canUndo ? { scale: 1.02 } : {}}
                                                        whileTap={canUndo ? { scale: 0.98 } : {}}
                                                        onClick={handleUndo}
                                                        disabled={!canUndo}
                                                        aria-label="Undo last action"
                                                        style={{
                                                            flex: 1,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '6px',
                                                            padding: '10px 12px',
                                                            background: canUndo ? 'rgba(59, 130, 246, 0.08)' : 'rgba(0,0,0,0.02)',
                                                            color: canUndo ? '#3b82f6' : '#94a3b8',
                                                            border: `1px solid ${canUndo ? 'rgba(59, 130, 246, 0.2)' : 'rgba(0,0,0,0.06)'}`,
                                                            borderRadius: '10px',
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            cursor: canUndo ? 'pointer' : 'not-allowed',
                                                        }}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>
                                                        Undo
                                                    </motion.button>
                                                    <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleFileImport} style={{ display: 'none' }} />
                                                    {/* Import Button */}
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => fileInputRef.current?.click()}
                                                        style={{
                                                            flex: 1,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '6px',
                                                            padding: '10px 12px',
                                                            background: 'rgba(16, 185, 129, 0.08)',
                                                            color: '#10b981',
                                                            border: '1px solid rgba(16, 185, 129, 0.2)',
                                                            borderRadius: '10px',
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                                        Import
                                                    </motion.button>
                                                    {/* Copy Button */}
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => setShowCopyModal(true)}
                                                        style={{
                                                            flex: 1,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '6px',
                                                            padding: '10px 12px',
                                                            background: 'rgba(139, 92, 246, 0.08)',
                                                            color: '#8b5cf6',
                                                            border: '1px solid rgba(139, 92, 246, 0.2)',
                                                            borderRadius: '10px',
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                                                        Copy
                                                    </motion.button>
                                                    {/* Curve Button */}
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => setShowCurveModal(true)}
                                                        style={{
                                                            flex: 1,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '6px',
                                                            padding: '10px 12px',
                                                            background: 'rgba(245, 158, 11, 0.08)',
                                                            color: '#f59e0b',
                                                            border: '1px solid rgba(245, 158, 11, 0.2)',
                                                            borderRadius: '10px',
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 20h20" /><path d="M5 20V10l7-7 7 7v10" /></svg>
                                                        Curve
                                                    </motion.button>
                                                </div>

                                                {/* Row 3: Secondary Actions (3 buttons) */}
                                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }} role="toolbar" aria-label="Secondary actions">
                                                    {/* Weights Button */}
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => setShowWeightModal(true)}
                                                        style={{
                                                            flex: 1,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '6px',
                                                            padding: '10px 12px',
                                                            background: gradeWeightConfig.enabled ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.05)',
                                                            color: '#3b82f6',
                                                            border: `1px solid ${gradeWeightConfig.enabled ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.15)'}`,
                                                            borderRadius: '10px',
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></svg>
                                                        {gradeWeightConfig.enabled ? 'Weights ✓' : 'Weights'}
                                                    </motion.button>
                                                    {/* Fill Button */}
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => handleFillAll(0)}
                                                        style={{
                                                            flex: 1,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '6px',
                                                            padding: '10px 12px',
                                                            borderRadius: '10px',
                                                            border: '1px solid rgba(0,0,0,0.08)',
                                                            background: '#ffffff',
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            color: '#64748b',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                                                        Fill (0)
                                                    </motion.button>
                                                    {/* Clear Button */}
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={handleClearAll}
                                                        style={{
                                                            flex: 1,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            padding: '10px 12px',
                                                            borderRadius: '10px',
                                                            border: '1px solid rgba(239, 68, 68, 0.2)',
                                                            background: 'rgba(239, 68, 68, 0.05)',
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            color: '#ef4444',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        Clear
                                                    </motion.button>
                                                </div>

                                                {/* Row 4: Quick Actions & Bulk Selection */}
                                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }} role="toolbar" aria-label="Bulk actions">
                                                    {/* Mark All Present - Quick Action */}
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={markAllPresent}
                                                        aria-label="Mark all students as present"
                                                        style={{
                                                            flex: 1,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '6px',
                                                            padding: '10px 12px',
                                                            borderRadius: '10px',
                                                            border: '1px solid rgba(16, 185, 129, 0.2)',
                                                            background: 'rgba(16, 185, 129, 0.05)',
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            color: '#10b981',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                            <polyline points="22 4 12 14.01 9 11.01" />
                                                        </svg>
                                                        All Present
                                                    </motion.button>
                                                    {/* Bulk Select Toggle */}
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => {
                                                            setBulkSelectionMode(!bulkSelectionMode);
                                                            if (bulkSelectionMode) clearSelection();
                                                        }}
                                                        aria-label={bulkSelectionMode ? "Exit bulk selection mode" : "Enter bulk selection mode"}
                                                        style={{
                                                            flex: 1,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '6px',
                                                            padding: '10px 12px',
                                                            borderRadius: '10px',
                                                            border: `1px solid ${bulkSelectionMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(0,0,0,0.08)'}`,
                                                            background: bulkSelectionMode ? 'rgba(59, 130, 246, 0.1)' : '#ffffff',
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            color: bulkSelectionMode ? '#3b82f6' : '#64748b',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                                            <rect x="3" y="3" width="7" height="7" />
                                                            <rect x="14" y="3" width="7" height="7" />
                                                            <rect x="14" y="14" width="7" height="7" />
                                                            <rect x="3" y="14" width="7" height="7" />
                                                        </svg>
                                                        {bulkSelectionMode ? `Select (${selectedStudents.size})` : 'Bulk Select'}
                                                    </motion.button>
                                                    {/* History/Audit Log Button */}
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => setShowAuditModal(true)}
                                                        aria-label="View grade history"
                                                        style={{
                                                            flex: 1,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '6px',
                                                            padding: '10px 12px',
                                                            borderRadius: '10px',
                                                            border: '1px solid rgba(100, 116, 139, 0.2)',
                                                            background: auditLog.length > 0 ? 'rgba(100, 116, 139, 0.05)' : '#ffffff',
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            color: '#64748b',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                                            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        History {auditLog.length > 0 && `(${auditLog.length})`}
                                                    </motion.button>
                                                </div>

                                                {/* Bulk Actions Bar - Only show when in bulk selection mode */}
                                                <AnimatePresence>
                                                    {bulkSelectionMode && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            style={{
                                                                marginTop: '8px',
                                                                padding: '12px',
                                                                borderRadius: '10px',
                                                                background: 'rgba(59, 130, 246, 0.05)',
                                                                border: '1px solid rgba(59, 130, 246, 0.15)',
                                                            }}
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#3b82f6' }}>
                                                                    {selectedStudents.size} student{selectedStudents.size !== 1 ? 's' : ''} selected
                                                                </span>
                                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.02 }}
                                                                        whileTap={{ scale: 0.98 }}
                                                                        onClick={selectAllStudents}
                                                                        style={{
                                                                            padding: '4px 8px',
                                                                            borderRadius: '6px',
                                                                            border: 'none',
                                                                            background: 'rgba(59, 130, 246, 0.1)',
                                                                            fontSize: '11px',
                                                                            fontWeight: 600,
                                                                            color: '#3b82f6',
                                                                            cursor: 'pointer',
                                                                        }}
                                                                    >
                                                                        Select All
                                                                    </motion.button>
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.02 }}
                                                                        whileTap={{ scale: 0.98 }}
                                                                        onClick={clearSelection}
                                                                        style={{
                                                                            padding: '4px 8px',
                                                                            borderRadius: '6px',
                                                                            border: 'none',
                                                                            background: 'rgba(0,0,0,0.05)',
                                                                            fontSize: '11px',
                                                                            fontWeight: 600,
                                                                            color: '#64748b',
                                                                            cursor: 'pointer',
                                                                        }}
                                                                    >
                                                                        Clear
                                                                    </motion.button>
                                                                </div>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                                <motion.button
                                                                    whileHover={{ scale: 1.02 }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                    onClick={bulkMarkAbsent}
                                                                    disabled={selectedStudents.size === 0}
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        borderRadius: '6px',
                                                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                                                        background: 'rgba(239, 68, 68, 0.05)',
                                                                        fontSize: '11px',
                                                                        fontWeight: 600,
                                                                        color: selectedStudents.size > 0 ? '#ef4444' : '#94a3b8',
                                                                        cursor: selectedStudents.size > 0 ? 'pointer' : 'not-allowed',
                                                                    }}
                                                                >
                                                                    Mark Absent
                                                                </motion.button>
                                                                <motion.button
                                                                    whileHover={{ scale: 1.02 }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                    onClick={bulkMarkExcused}
                                                                    disabled={selectedStudents.size === 0}
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        borderRadius: '6px',
                                                                        border: '1px solid rgba(245, 158, 11, 0.2)',
                                                                        background: 'rgba(245, 158, 11, 0.05)',
                                                                        fontSize: '11px',
                                                                        fontWeight: 600,
                                                                        color: selectedStudents.size > 0 ? '#f59e0b' : '#94a3b8',
                                                                        cursor: selectedStudents.size > 0 ? 'pointer' : 'not-allowed',
                                                                    }}
                                                                >
                                                                    Mark Excused
                                                                </motion.button>
                                                                <motion.button
                                                                    whileHover={{ scale: 1.02 }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                    onClick={bulkMarkPresent}
                                                                    disabled={selectedStudents.size === 0}
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        borderRadius: '6px',
                                                                        border: '1px solid rgba(16, 185, 129, 0.2)',
                                                                        background: 'rgba(16, 185, 129, 0.05)',
                                                                        fontSize: '11px',
                                                                        fontWeight: 600,
                                                                        color: selectedStudents.size > 0 ? '#10b981' : '#94a3b8',
                                                                        cursor: selectedStudents.size > 0 ? 'pointer' : 'not-allowed',
                                                                    }}
                                                                >
                                                                    Mark Present
                                                                </motion.button>
                                                                <motion.button
                                                                    whileHover={{ scale: 1.02 }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                    onClick={() => bulkFillScore(0)}
                                                                    disabled={selectedStudents.size === 0}
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        borderRadius: '6px',
                                                                        border: '1px solid rgba(59, 130, 246, 0.2)',
                                                                        background: 'rgba(59, 130, 246, 0.05)',
                                                                        fontSize: '11px',
                                                                        fontWeight: 600,
                                                                        color: selectedStudents.size > 0 ? '#3b82f6' : '#94a3b8',
                                                                        cursor: selectedStudents.size > 0 ? 'pointer' : 'not-allowed',
                                                                    }}
                                                                >
                                                                    Fill Score (0)
                                                                </motion.button>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                {/* Row 4: Export Buttons */}
                                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }} role="toolbar" aria-label="Export actions">
                                                    {/* Export to Excel/CSV */}
                                                    <motion.button
                                                        whileHover={{
                                                            scale: 1.02,
                                                            boxShadow: '0 6px 20px rgba(16, 185, 129, 0.25)',
                                                        }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={handleExportCSV}
                                                        aria-label="Export scores to Excel CSV"
                                                        style={{
                                                            flex: 1,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '6px',
                                                            padding: '10px 12px',
                                                            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
                                                            color: '#10b981',
                                                            border: '1px solid rgba(16, 185, 129, 0.2)',
                                                            borderRadius: '10px',
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                            <polyline points="7 10 12 15 17 10" />
                                                            <line x1="12" y1="15" x2="12" y2="3" />
                                                        </svg>
                                                        Export to Excel
                                                    </motion.button>
                                                    {/* Export to PDF / Print */}
                                                    <motion.button
                                                        whileHover={{
                                                            scale: 1.02,
                                                            boxShadow: '0 6px 20px rgba(59, 130, 246, 0.25)',
                                                        }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={handleExportPDF}
                                                        aria-label="Export scores to PDF for printing"
                                                        style={{
                                                            flex: 1,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '6px',
                                                            padding: '10px 12px',
                                                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
                                                            color: '#3b82f6',
                                                            border: '1px solid rgba(59, 130, 246, 0.2)',
                                                            borderRadius: '10px',
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                                            <polyline points="6 9 6 2 18 2 18 9" />
                                                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                                            <rect x="6" y="14" width="12" height="8" />
                                                        </svg>
                                                        Print / PDF
                                                    </motion.button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </>
                            )}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
                            {!selectedExam ? (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '60px 20px',
                                    color: '#94a3b8',
                                }}>
                                    <div style={{
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: '16px',
                                        background: 'rgba(59, 130, 246, 0.08)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '16px',
                                    }}>
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5">
                                            <path d="M9 11l3 3L22 4" />
                                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                        </svg>
                                    </div>
                                    <p style={{ fontSize: '14px', fontWeight: 500, margin: 0 }}>
                                        Select a course and exam to start entering scores
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Statistics */}
                                    <ScoreStatistics scores={scores} maxScore={currentExam?.maxScore || 100} gradingSystem={gradingSystem} />

                                    {/* Attendance Summary */}
                                    <AttendanceSummary
                                        scores={scores}
                                        onExportReport={() => {
                                            // Export attendance data as part of the score export
                                            const attendanceData = scores.map(s => ({
                                                studentId: s.studentId,
                                                studentName: s.studentName || '',
                                                status: s.isAbsent
                                                    ? (s.isExcused ? 'Excused' : 'Absent')
                                                    : 'Present',
                                            }));
                                            const csv = [
                                                'Student ID,Student Name,Attendance Status',
                                                ...attendanceData.map(a => `"${a.studentId}","${a.studentName}","${a.status}"`)
                                            ].join('\n');
                                            const blob = new Blob([csv], { type: 'text/csv' });
                                            const url = URL.createObjectURL(blob);
                                            const link = document.createElement('a');
                                            link.href = url;
                                            link.download = `attendance_${currentExam?.title?.replace(/\s+/g, '_') || 'exam'}_${new Date().toISOString().split('T')[0]}.csv`;
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                            URL.revokeObjectURL(url);
                                        }}
                                    />

                                    {/* Auto-save Status Indicator */}
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

                                    {/* Keyboard Shortcut Hint */}
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '16px',
                                            padding: '10px 16px',
                                            marginTop: '12px',
                                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.04) 0%, rgba(59, 130, 246, 0.02) 100%)',
                                            borderRadius: '10px',
                                            border: '1px solid rgba(59, 130, 246, 0.08)',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <kbd style={{
                                                padding: '3px 8px',
                                                borderRadius: '6px',
                                                background: '#ffffff',
                                                border: '1px solid rgba(0,0,0,0.1)',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                color: '#3b82f6',
                                                fontFamily: 'inherit',
                                            }}>
                                                Enter
                                            </kbd>
                                            <span style={{ fontSize: '12px', color: '#64748b' }}>or</span>
                                            <kbd style={{
                                                padding: '3px 8px',
                                                borderRadius: '6px',
                                                background: '#ffffff',
                                                border: '1px solid rgba(0,0,0,0.1)',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                color: '#3b82f6',
                                                fontFamily: 'inherit',
                                            }}>
                                                Tab
                                            </kbd>
                                            <span style={{ fontSize: '12px', color: '#64748b' }}>to move to next student</span>
                                        </div>
                                        <div style={{ width: '1px', height: '16px', background: 'rgba(0,0,0,0.08)' }} />
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                                                Showing <span style={{ fontWeight: 600, color: '#3b82f6' }}>{filteredStudents.length}</span> of {students.length} students
                                            </span>
                                        </div>
                                    </motion.div>

                                    {/* Student List */}
                                    <div
                                        style={{ marginTop: '12px' }}
                                        role="table"
                                        aria-label="Student scores list"
                                    >
                                        <div
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: bulkSelectionMode ? '32px 1fr 100px 90px 80px 90px' : '1fr 100px 90px 80px 90px',
                                                gap: '8px',
                                                padding: '8px 12px',
                                                background: 'rgba(0,0,0,0.02)',
                                                borderRadius: '10px',
                                                marginBottom: '8px',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                color: '#64748b',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                            }}
                                            role="row"
                                        >
                                            {bulkSelectionMode && (
                                                <span role="columnheader" style={{ textAlign: 'center' }}>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => {
                                                            if (selectedStudents.size === filteredStudents.length) {
                                                                clearSelection();
                                                            } else {
                                                                selectAllStudents();
                                                            }
                                                        }}
                                                        style={{
                                                            width: '18px',
                                                            height: '18px',
                                                            borderRadius: '4px',
                                                            border: `2px solid ${selectedStudents.size === filteredStudents.length ? '#3b82f6' : 'rgba(0,0,0,0.15)'}`,
                                                            background: selectedStudents.size === filteredStudents.length ? '#3b82f6' : 'transparent',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}
                                                    >
                                                        {selectedStudents.size === filteredStudents.length && (
                                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3">
                                                                <polyline points="20 6 9 17 4 12" />
                                                            </svg>
                                                        )}
                                                    </motion.button>
                                                </span>
                                            )}
                                            <span role="columnheader">Student</span>
                                            <span role="columnheader" style={{ textAlign: 'center' }}>Section</span>
                                            <span role="columnheader" style={{ textAlign: 'center' }}>Status</span>
                                            <span role="columnheader" style={{ textAlign: 'center' }}>Score</span>
                                            <span role="columnheader" style={{ textAlign: 'center' }}>Grade</span>
                                        </div>

                                        {isLoadingStudents ? (
                                            <div style={{
                                                padding: '40px 20px',
                                                textAlign: 'center',
                                                color: '#94a3b8',
                                            }}>
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                    style={{ display: 'inline-block', marginBottom: '12px' }}
                                                >
                                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                                                        <path d="M21 12a9 9 0 11-6.219-8.56" />
                                                    </svg>
                                                </motion.div>
                                                <p style={{ margin: 0, fontSize: '13px', fontWeight: 500 }}>
                                                    Loading students from database...
                                                </p>
                                                <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
                                                    Fetching BSIT101A section
                                                </p>
                                            </div>
                                        ) : filteredStudents.length === 0 ? (
                                            <div style={{
                                                padding: '40px 20px',
                                                textAlign: 'center',
                                                color: '#94a3b8',
                                            }}>
                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '8px', opacity: 0.5 }} aria-hidden="true">
                                                    <circle cx="11" cy="11" r="8" />
                                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                                </svg>
                                                <p style={{ margin: 0, fontSize: '13px', fontWeight: 500 }}>
                                                    No students found
                                                </p>
                                                <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
                                                    {students.length === 0
                                                        ? 'No students enrolled in BSIT101A section'
                                                        : 'Try adjusting your search'
                                                    }
                                                </p>
                                            </div>
                                        ) : filteredStudents.map((student, index) => {
                                            const scoreData = scores.find(s => s.studentId === student.studentId);
                                            const rawScore = scoreData?.score;
                                            const isAbsent = scoreData?.isAbsent || false;
                                            const isExcused = scoreData?.isExcused || false;
                                            const isSelected = selectedStudents.has(student.studentId);

                                            // Determine attendance status
                                            const attendanceStatus: AttendanceStatus = isAbsent
                                                ? (isExcused ? 'excused' : 'absent')
                                                : 'present';

                                            // Calculate Philippine grade if score exists and student is present
                                            const gradeResult = rawScore !== null && rawScore !== undefined && !isAbsent
                                                ? calculateGrade(rawScore, currentExam?.maxScore || 100, gradingSystem)
                                                : null;

                                            return (
                                                <motion.div
                                                    role="row"
                                                    key={student.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.02 }}
                                                    aria-label={`${student.name}, ${student.section}, ${attendanceStatus}, score: ${rawScore ?? 'not entered'}, grade: ${gradeResult ? gradeResult.transmutedGrade : 'pending'}`}
                                                    style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: bulkSelectionMode ? '32px 1fr 100px 90px 80px 90px' : '1fr 100px 90px 80px 90px',
                                                        gap: '8px',
                                                        padding: '12px',
                                                        alignItems: 'center',
                                                        borderRadius: '10px',
                                                        background: isSelected
                                                            ? 'rgba(59, 130, 246, 0.08)'
                                                            : isAbsent
                                                                ? 'rgba(239, 68, 68, 0.03)'
                                                                : index % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)',
                                                        opacity: isAbsent && !isSelected ? 0.7 : 1,
                                                        border: isSelected ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent',
                                                    }}
                                                >
                                                    {/* Checkbox for bulk selection */}
                                                    {bulkSelectionMode && (
                                                        <div role="cell" style={{ display: 'flex', justifyContent: 'center' }}>
                                                            <motion.button
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={() => toggleStudentSelection(student.studentId)}
                                                                style={{
                                                                    width: '20px',
                                                                    height: '20px',
                                                                    borderRadius: '4px',
                                                                    border: `2px solid ${isSelected ? '#3b82f6' : 'rgba(0,0,0,0.15)'}`,
                                                                    background: isSelected ? '#3b82f6' : 'transparent',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                }}
                                                            >
                                                                {isSelected && (
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3">
                                                                        <polyline points="20 6 9 17 4 12" />
                                                                    </svg>
                                                                )}
                                                            </motion.button>
                                                        </div>
                                                    )}
                                                    <div role="cell" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{
                                                                fontSize: '14px',
                                                                fontWeight: 600,
                                                                color: isAbsent ? '#94a3b8' : '#0f172a',
                                                                textDecoration: isAbsent ? 'line-through' : 'none',
                                                            }}>
                                                                {student.name}
                                                            </div>
                                                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                                                {student.studentId}
                                                            </div>
                                                        </div>
                                                        {/* Score History Button */}
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => {
                                                                setSelectedStudentForHistory({ id: student.studentId, name: student.name });
                                                                // Generate mock history data (in production, fetch from database)
                                                                const mockHistory = examHistory.slice(0, 5).map((exam) => ({
                                                                    examTitle: exam.examTitle,
                                                                    score: Math.floor(Math.random() * 30) + 70,
                                                                    maxScore: 100, // Default max score
                                                                    date: exam.date,
                                                                }));
                                                                setStudentScoreHistory(prev => ({
                                                                    ...prev,
                                                                    [student.studentId]: mockHistory,
                                                                }));
                                                                setShowScoreHistoryModal(true);
                                                            }}
                                                            title={`View score history for ${student.name}`}
                                                            style={{
                                                                width: '24px',
                                                                height: '24px',
                                                                borderRadius: '6px',
                                                                border: 'none',
                                                                background: 'rgba(59, 130, 246, 0.08)',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                color: '#3b82f6',
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M3 3v18h18" />
                                                                <path d="M18 17V9" />
                                                                <path d="M13 17V5" />
                                                                <path d="M8 17v-3" />
                                                            </svg>
                                                        </motion.button>
                                                    </div>
                                                    <div role="cell" style={{ textAlign: 'center' }}>
                                                        <span style={{
                                                            padding: '4px 10px',
                                                            borderRadius: '6px',
                                                            background: 'rgba(59, 130, 246, 0.08)',
                                                            fontSize: '12px',
                                                            fontWeight: 500,
                                                            color: '#3b82f6',
                                                        }}>
                                                            {student.section}
                                                        </span>
                                                    </div>
                                                    {/* Attendance Status Column */}
                                                    <div role="cell" style={{ display: 'flex', justifyContent: 'center' }}>
                                                        <AttendanceDropdown
                                                            value={attendanceStatus}
                                                            onChange={(status) => handleAttendanceChange(student.studentId, status)}
                                                            studentName={student.name}
                                                        />
                                                    </div>
                                                    <div role="cell" style={{ display: 'flex', justifyContent: 'center' }}>
                                                        {isAbsent ? (
                                                            <span style={{
                                                                fontSize: '11px',
                                                                color: '#94a3b8',
                                                                fontStyle: 'italic',
                                                            }}>
                                                                {isExcused ? 'EXC' : 'ABS'}
                                                            </span>
                                                        ) : (
                                                            <ScoreInputWithRef
                                                                ref={(el) => { inputRefs.current[index] = el; }}
                                                                value={scoreData?.score ?? null}
                                                                maxScore={currentExam?.maxScore || 100}
                                                                onChange={(v) => handleScoreChange(student.studentId, v)}
                                                                studentName={student.name}
                                                                onKeyDown={(e) => handleKeyDown(e, index)}
                                                            />
                                                        )}
                                                    </div>
                                                    {/* Transmuted Grade Column */}
                                                    <div role="cell" style={{ display: 'flex', justifyContent: 'center' }}>
                                                        {gradeResult ? (
                                                            <div style={{
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'center',
                                                                gap: '2px',
                                                            }}>
                                                                <span style={{
                                                                    padding: '4px 10px',
                                                                    borderRadius: '6px',
                                                                    background: `${getGradeColor(gradeResult.transmutedGrade)}15`,
                                                                    border: `1px solid ${getGradeColor(gradeResult.transmutedGrade)}30`,
                                                                    fontSize: '13px',
                                                                    fontWeight: 700,
                                                                    color: getGradeColor(gradeResult.transmutedGrade),
                                                                }}>
                                                                    {gradeResult.transmutedGrade}
                                                                </span>
                                                                <span style={{
                                                                    fontSize: '9px',
                                                                    color: gradeResult.remarks === 'PASSED' ? '#10b981' : '#ef4444',
                                                                    fontWeight: 600,
                                                                }}>
                                                                    {gradeResult.letterGrade} · {gradeResult.remarks}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span style={{
                                                                fontSize: '11px',
                                                                color: '#94a3b8',
                                                            }} aria-label="Grade pending">
                                                                —
                                                            </span>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div
                            style={{
                                padding: '16px 24px',
                                borderTop: '1px solid rgba(0,0,0,0.06)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '12px',
                            }}
                            role="group"
                            aria-label="Modal actions"
                        >
                            {/* Left side - Draft status indicator */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {lastDraftSave && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 10px',
                                            borderRadius: '8px',
                                            background: 'rgba(16, 185, 129, 0.08)',
                                            fontSize: '11px',
                                            fontWeight: 500,
                                            color: '#10b981',
                                        }}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                        Draft saved {lastDraftSave.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </motion.div>
                                )}
                                {hasUnsavedChanges && !lastDraftSave && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 10px',
                                            borderRadius: '8px',
                                            background: 'rgba(245, 158, 11, 0.08)',
                                            fontSize: '11px',
                                            fontWeight: 500,
                                            color: '#f59e0b',
                                        }}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="8" x2="12" y2="12" />
                                            <line x1="12" y1="16" x2="12.01" y2="16" />
                                        </svg>
                                        Unsaved changes
                                    </motion.div>
                                )}
                            </div>

                            {/* Right side - Action buttons */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onClose}
                                    aria-label="Cancel and close modal"
                                    style={{
                                        padding: '12px 16px',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(0,0,0,0.08)',
                                        background: '#ffffff',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        color: '#64748b',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Cancel
                                </motion.button>
                                {/* Save Draft Button */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSaveDraft}
                                    disabled={!selectedExam || isSaving}
                                    aria-label="Save as draft"
                                    style={{
                                        padding: '12px 16px',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(59, 130, 246, 0.2)',
                                        background: 'rgba(59, 130, 246, 0.05)',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        color: selectedExam ? '#3b82f6' : '#94a3b8',
                                        cursor: selectedExam ? 'pointer' : 'not-allowed',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        opacity: selectedExam ? 1 : 0.6,
                                    }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="16" y1="13" x2="8" y2="13" />
                                        <line x1="16" y1="17" x2="8" y2="17" />
                                    </svg>
                                    Save Draft
                                </motion.button>
                                {/* Finalize Button */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleSaveClick(false)}
                                    disabled={!selectedExam || isSaving}
                                    aria-label={isSaving ? 'Saving scores...' : 'Finalize and save exam scores'}
                                    aria-disabled={!selectedExam || isSaving}
                                    style={{
                                        padding: '12px 20px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: selectedExam ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'rgba(0,0,0,0.06)',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        color: selectedExam ? '#ffffff' : '#94a3b8',
                                        cursor: selectedExam ? 'pointer' : 'not-allowed',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        boxShadow: selectedExam ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
                                    }}
                                >
                                    {isSaving ? (
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                                <path d="M21 12a9 9 0 11-6.219-8.56" />
                                            </svg>
                                        </motion.div>
                                    ) : (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                    )}
                                    Finalize
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <>
            {createPortal(modalContent, document.body)}
            <ImportPreviewModal
                isOpen={showImportPreview}
                onClose={() => { setShowImportPreview(false); setImportedData([]); }}
                importedData={importedData}
                onConfirm={handleImportConfirm}
                maxScore={currentExam?.maxScore || 100}
            />
            <CopyFromExamModal
                isOpen={showCopyModal}
                onClose={() => setShowCopyModal(false)}
                onSelect={handleCopyFromExam}
                currentExamId={selectedExam}
                courseId={selectedCourse}
                examHistory={examHistory}
                isLoadingHistory={isLoadingHistory}
            />
            <ApplyCurveModal
                isOpen={showCurveModal}
                onClose={() => setShowCurveModal(false)}
                onApply={handleApplyCurve}
                currentScores={scores}
                maxScore={currentExam?.maxScore || 100}
            />

            <GradeWeightingModal
                isOpen={showWeightModal}
                onClose={() => setShowWeightModal(false)}
                weightConfig={gradeWeightConfig}
                onSave={setGradeWeightConfig}
                exams={exams}
            />
            <AuditLogModal
                isOpen={showAuditModal}
                onClose={() => setShowAuditModal(false)}
                auditLog={auditLog}
            />
            {/* Student Score History Modal */}
            <StudentScoreHistoryModal
                isOpen={showScoreHistoryModal}
                onClose={() => {
                    setShowScoreHistoryModal(false);
                    setSelectedStudentForHistory(null);
                }}
                student={selectedStudentForHistory}
                history={selectedStudentForHistory ? (studentScoreHistory[selectedStudentForHistory.id] || []) : []}
            />
            {/* Save Confirmation Dialog */}
            <AnimatePresence>
                {showSaveConfirm && createPortal(
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowSaveConfirm(false)}
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="save-confirm-title"
                        aria-describedby="save-confirm-description"
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(15, 23, 42, 0.8)',
                            backdropFilter: 'blur(4px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10001,
                            padding: '20px',
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            onAnimationComplete={() => {
                                // Focus the Go Back button when dialog opens
                                saveConfirmGoBackRef.current?.focus();
                            }}
                            style={{
                                width: '100%',
                                maxWidth: '400px',
                                background: '#ffffff',
                                borderRadius: '16px',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                                overflow: 'hidden',
                            }}
                        >
                            {/* Header */}
                            <div style={{
                                padding: '20px 24px',
                                borderBottom: '1px solid rgba(0,0,0,0.06)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                            }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }} aria-hidden="true">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" aria-hidden="true">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                        <line x1="12" y1="9" x2="12" y2="13" />
                                        <line x1="12" y1="17" x2="12.01" y2="17" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 id="save-confirm-title" style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                                        Incomplete Scores
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                                        Please confirm before saving
                                    </p>
                                </div>
                            </div>

                            {/* Content */}
                            <div style={{ padding: '20px 24px' }}>
                                <p id="save-confirm-description" style={{
                                    margin: 0,
                                    fontSize: '14px',
                                    color: '#334155',
                                    lineHeight: 1.6,
                                    whiteSpace: 'pre-line',
                                }}>
                                    {saveWarningMessage}
                                </p>

                                {/* Quick stats */}
                                <div
                                    style={{
                                        marginTop: '16px',
                                        padding: '12px 16px',
                                        borderRadius: '10px',
                                        background: 'rgba(245, 158, 11, 0.08)',
                                        border: '1px solid rgba(245, 158, 11, 0.15)',
                                        display: 'flex',
                                        justifyContent: 'space-around',
                                    }}
                                    role="status"
                                    aria-label={`Score summary: ${scores.filter(s => s.score !== null).length} filled, ${scores.filter(s => s.score === null).length} empty, ${scores.length} total`}
                                >
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#10b981' }}>
                                            {scores.filter(s => s.score !== null).length}
                                        </div>
                                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 500 }}>FILLED</div>
                                    </div>
                                    <div style={{ width: '1px', background: 'rgba(0,0,0,0.08)' }} aria-hidden="true" />
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#f59e0b' }}>
                                            {scores.filter(s => s.score === null).length}
                                        </div>
                                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 500 }}>EMPTY</div>
                                    </div>
                                    <div style={{ width: '1px', background: 'rgba(0,0,0,0.08)' }} aria-hidden="true" />
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#3b82f6' }}>
                                            {scores.length}
                                        </div>
                                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 500 }}>TOTAL</div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div
                                style={{
                                    padding: '16px 24px',
                                    borderTop: '1px solid rgba(0,0,0,0.06)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    gap: '10px',
                                }}
                                role="group"
                                aria-label="Confirmation actions"
                            >
                                <motion.button
                                    ref={saveConfirmGoBackRef}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowSaveConfirm(false)}
                                    aria-label="Go back to editing scores"
                                    style={{
                                        padding: '10px 16px',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(0,0,0,0.08)',
                                        background: '#ffffff',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        color: '#64748b',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Go Back
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(245, 158, 11, 0.25)' }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleConfirmSave}
                                    aria-label="Save scores with empty entries"
                                    style={{
                                        padding: '10px 16px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        color: '#ffffff',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                    }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                        <polyline points="17 21 17 13 7 13 7 21" />
                                        <polyline points="7 3 7 8 15 8" />
                                    </svg>
                                    Save Anyway
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>,
                    document.body
                )}
            </AnimatePresence>

            {/* Save Status Toast */}
            <AnimatePresence>
                {saveStatus.show && createPortal(
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        role="alert"
                        aria-live="polite"
                        style={{
                            position: 'fixed',
                            bottom: '24px',
                            right: '24px',
                            zIndex: 10002,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '14px 18px',
                            borderRadius: '12px',
                            background: saveStatus.type === 'success'
                                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            boxShadow: saveStatus.type === 'success'
                                ? '0 10px 40px rgba(16, 185, 129, 0.3), 0 4px 12px rgba(0, 0, 0, 0.1)'
                                : '0 10px 40px rgba(239, 68, 68, 0.3), 0 4px 12px rgba(0, 0, 0, 0.1)',
                            maxWidth: '400px',
                        }}
                    >
                        {/* Icon */}
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            {saveStatus.type === 'success' ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" aria-hidden="true">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" aria-hidden="true">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                            )}
                        </div>

                        {/* Message */}
                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#ffffff',
                                marginBottom: '2px',
                            }}>
                                {saveStatus.type === 'success' ? 'Scores Saved!' : 'Save Failed'}
                            </div>
                            <div style={{
                                fontSize: '12px',
                                color: 'rgba(255, 255, 255, 0.85)',
                                lineHeight: 1.4,
                            }}>
                                {saveStatus.message}
                            </div>
                        </div>

                        {/* Close button */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setSaveStatus(prev => ({ ...prev, show: false }))}
                            aria-label="Dismiss notification"
                            style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '6px',
                                border: 'none',
                                background: 'rgba(255, 255, 255, 0.15)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" aria-hidden="true">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </motion.button>
                    </motion.div>,
                    document.body
                )}
            </AnimatePresence>
        </>
    );
};

export default InputScoresModal;