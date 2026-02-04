/**
 * Attendance Service - Manages student attendance records
 * Integrates with exam scores for attendance tracking
 * 
 * Features:
 * - Track attendance per exam/class session
 * - Generate attendance reports
 * - Calculate attendance statistics
 * - Export attendance data
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

// LocalStorage key for demo mode
const STORAGE_KEY = 'elms_attendance_records';

// Types
export interface AttendanceRecord {
    id?: string;
    student_id: string;
    student_name: string;
    section: string;
    course_id: string;
    exam_id?: string;
    session_date: string;
    status: 'present' | 'absent' | 'excused' | 'late';
    remarks?: string;
    recorded_by?: string;
    recorded_at?: string;
}

export interface AttendanceSummary {
    studentId: string;
    studentName: string;
    totalSessions: number;
    present: number;
    absent: number;
    excused: number;
    late: number;
    attendanceRate: number; // percentage
}

export interface CourseAttendanceStats {
    courseId: string;
    totalSessions: number;
    avgAttendanceRate: number;
    perfectAttendance: number; // students with 100%
    atRisk: number; // students below 80%
}

export interface AttendanceReportData {
    courseId: string;
    courseName: string;
    section: string;
    generatedAt: string;
    dateRange: { from: string; to: string };
    totalSessions: number;
    students: AttendanceSummary[];
    overallStats: {
        avgAttendanceRate: number;
        totalPresent: number;
        totalAbsent: number;
        totalExcused: number;
    };
}

// ============================================
// LocalStorage Helpers (for demo mode)
// ============================================

const getLocalRecords = (): AttendanceRecord[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

const saveLocalRecords = (records: AttendanceRecord[]): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (err) {
        console.error('[Attendance] localStorage save error:', err);
    }
};

// ============================================
// Attendance Functions
// ============================================

/**
 * Record attendance from exam scores
 * Called when saving exam scores to sync attendance data
 */
export const syncAttendanceFromExamScores = async (
    examId: string,
    courseId: string,
    sessionDate: string,
    scores: {
        studentId: string;
        studentName: string;
        section: string;
        isAbsent?: boolean;
        isExcused?: boolean;
    }[],
    recordedBy: string = 'TEACHER001'
): Promise<{ success: boolean; syncedCount: number }> => {
    const records: AttendanceRecord[] = scores.map(s => ({
        student_id: s.studentId,
        student_name: s.studentName,
        section: s.section,
        course_id: courseId,
        exam_id: examId,
        session_date: sessionDate,
        status: s.isAbsent 
            ? (s.isExcused ? 'excused' : 'absent') 
            : 'present',
        recorded_by: recordedBy,
        recorded_at: new Date().toISOString(),
    }));

    if (!isSupabaseConfigured() || !supabase) {
        // Demo mode - save to localStorage
        const existing = getLocalRecords();
        // Remove old records for this exam
        const filtered = existing.filter(r => r.exam_id !== examId);
        saveLocalRecords([...filtered, ...records]);
        return { success: true, syncedCount: records.length };
    }

    try {
        const { error } = await supabase
            .from('attendance_records')
            .upsert(records, {
                onConflict: 'exam_id,student_id',
                ignoreDuplicates: false,
            });

        if (error) {
            console.error('[Attendance] Sync error:', error);
            // Fallback to localStorage
            const existing = getLocalRecords();
            const filtered = existing.filter(r => r.exam_id !== examId);
            saveLocalRecords([...filtered, ...records]);
        }

        return { success: true, syncedCount: records.length };
    } catch (err) {
        console.error('[Attendance] Sync error:', err);
        return { success: false, syncedCount: 0 };
    }
};

/**
 * Get attendance records for a course
 */
export const getAttendanceRecords = async (
    courseId: string,
    section?: string,
    dateFrom?: string,
    dateTo?: string
): Promise<AttendanceRecord[]> => {
    if (!isSupabaseConfigured() || !supabase) {
        let records = getLocalRecords().filter(r => r.course_id === courseId);
        if (section) records = records.filter(r => r.section === section);
        if (dateFrom) records = records.filter(r => r.session_date >= dateFrom);
        if (dateTo) records = records.filter(r => r.session_date <= dateTo);
        return records;
    }

    try {
        let query = supabase
            .from('attendance_records')
            .select('*')
            .eq('course_id', courseId);

        if (section) query = query.eq('section', section);
        if (dateFrom) query = query.gte('session_date', dateFrom);
        if (dateTo) query = query.lte('session_date', dateTo);

        const { data, error } = await query.order('session_date', { ascending: false });

        if (error) {
            console.error('[Attendance] Fetch error:', error);
            return getLocalRecords().filter(r => r.course_id === courseId);
        }

        return data || [];
    } catch (err) {
        console.error('[Attendance] Fetch error:', err);
        return [];
    }
};

/**
 * Calculate attendance summary for students
 */
export const calculateAttendanceSummary = (
    records: AttendanceRecord[]
): AttendanceSummary[] => {
    // Group by student
    const studentMap = new Map<string, AttendanceRecord[]>();
    
    records.forEach(r => {
        const existing = studentMap.get(r.student_id) || [];
        studentMap.set(r.student_id, [...existing, r]);
    });

    // Calculate summary for each student
    const summaries: AttendanceSummary[] = [];
    
    studentMap.forEach((studentRecords, studentId) => {
        const present = studentRecords.filter(r => r.status === 'present').length;
        const absent = studentRecords.filter(r => r.status === 'absent').length;
        const excused = studentRecords.filter(r => r.status === 'excused').length;
        const late = studentRecords.filter(r => r.status === 'late').length;
        const total = studentRecords.length;
        
        // Attendance rate: present + late + excused count as attended
        const attended = present + late + excused;
        const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 0;

        summaries.push({
            studentId,
            studentName: studentRecords[0]?.student_name || 'Unknown',
            totalSessions: total,
            present,
            absent,
            excused,
            late,
            attendanceRate,
        });
    });

    return summaries.sort((a, b) => a.studentName.localeCompare(b.studentName));
};

/**
 * Calculate attendance from current exam scores (for real-time display)
 * This doesn't require saved attendance records - calculates from score data
 */
export const calculateAttendanceFromScores = (
    scores: {
        studentId: string;
        studentName: string;
        isAbsent?: boolean;
        isExcused?: boolean;
    }[]
): {
    total: number;
    present: number;
    absent: number;
    excused: number;
    attendanceRate: number;
} => {
    const total = scores.length;
    const absent = scores.filter(s => s.isAbsent && !s.isExcused).length;
    const excused = scores.filter(s => s.isAbsent && s.isExcused).length;
    const present = total - absent - excused;
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

    return { total, present, absent, excused, attendanceRate };
};

/**
 * Generate attendance report data
 */
export const generateAttendanceReport = async (
    courseId: string,
    courseName: string,
    section: string,
    dateFrom?: string,
    dateTo?: string
): Promise<AttendanceReportData> => {
    const records = await getAttendanceRecords(courseId, section, dateFrom, dateTo);
    const summaries = calculateAttendanceSummary(records);
    
    // Get unique session dates
    const sessionDates = [...new Set(records.map(r => r.session_date))];
    
    // Calculate overall stats
    const totalPresent = summaries.reduce((sum, s) => sum + s.present, 0);
    const totalAbsent = summaries.reduce((sum, s) => sum + s.absent, 0);
    const totalExcused = summaries.reduce((sum, s) => sum + s.excused, 0);
    const avgAttendanceRate = summaries.length > 0
        ? Math.round(summaries.reduce((sum, s) => sum + s.attendanceRate, 0) / summaries.length)
        : 0;

    return {
        courseId,
        courseName,
        section,
        generatedAt: new Date().toISOString(),
        dateRange: {
            from: dateFrom || sessionDates[sessionDates.length - 1] || '',
            to: dateTo || sessionDates[0] || '',
        },
        totalSessions: sessionDates.length,
        students: summaries,
        overallStats: {
            avgAttendanceRate,
            totalPresent,
            totalAbsent,
            totalExcused,
        },
    };
};

/**
 * Export attendance report to CSV format
 */
export const exportAttendanceToCSV = (report: AttendanceReportData): string => {
    const headers = [
        'Student ID',
        'Student Name',
        'Total Sessions',
        'Present',
        'Absent',
        'Excused',
        'Attendance Rate (%)',
    ];

    const rows = report.students.map(s => [
        s.studentId,
        s.studentName,
        s.totalSessions.toString(),
        s.present.toString(),
        s.absent.toString(),
        s.excused.toString(),
        s.attendanceRate.toString(),
    ]);

    // Add summary row
    rows.push([]);
    rows.push(['--- SUMMARY ---']);
    rows.push(['Course:', report.courseName]);
    rows.push(['Section:', report.section]);
    rows.push(['Date Range:', `${report.dateRange.from} to ${report.dateRange.to}`]);
    rows.push(['Total Sessions:', report.totalSessions.toString()]);
    rows.push(['Average Attendance Rate:', `${report.overallStats.avgAttendanceRate}%`]);
    rows.push(['Generated:', new Date(report.generatedAt).toLocaleString()]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
};

/**
 * Download attendance report as CSV file
 */
export const downloadAttendanceReport = (report: AttendanceReportData): void => {
    const csv = exportAttendanceToCSV(report);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_${report.courseName.replace(/\s+/g, '_')}_${report.section}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
