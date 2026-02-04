/**
 * Types for InputScoresModal components
 */

export interface Student {
    id: string;
    name: string;
    studentId: string;
    section: string;
}

export interface ExamScore {
    studentId: string;
    studentName?: string;
    score: number | null;
    remarks?: string;
    isAbsent?: boolean;
    isExcused?: boolean;
}

export type AttendanceStatus = 'present' | 'absent' | 'excused';

export interface Exam {
    id: string;
    title: string;
    maxScore: number;
    date: string;
    courseId: string;
}

export interface Course {
    id: string;
    title: string;
    shortTitle: string;
}

export interface InputScoresModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: (examId: string, scores: ExamScore[]) => Promise<void>;
}

export interface ImportedRow {
    studentId: string;
    studentName: string;
    score: number | null;
    matched: boolean;
    matchedStudentId?: string;
}
