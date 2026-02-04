/**
 * Score Export Utilities
 * Export exam scores to Excel (CSV) and PDF formats
 * 
 * For Philippine eLMS - STI College
 */

import { calculateGrade, type GradingSystem } from '../grading/philippineGrading';

export interface ExportScoreData {
    studentId: string;
    studentName: string;
    section: string;
    score: number | null;
    isAbsent?: boolean;
    isExcused?: boolean;
    remarks?: string;
}

export interface ExportOptions {
    examTitle: string;
    courseTitle: string;
    maxScore: number;
    gradingSystem: GradingSystem;
    exportDate: Date;
    teacherName?: string;
}

/**
 * Export scores to CSV format (Excel-compatible)
 */
export function exportToCSV(
    scores: ExportScoreData[],
    options: ExportOptions
): string {
    const { examTitle, courseTitle, maxScore, gradingSystem, exportDate, teacherName } = options;
    
    // Header rows with metadata
    const metaRows = [
        `"Course:","${courseTitle}"`,
        `"Exam:","${examTitle}"`,
        `"Max Score:","${maxScore}"`,
        `"Grading System:","${gradingSystem.toUpperCase()}"`,
        `"Export Date:","${exportDate.toLocaleDateString('en-PH')}"`,
        teacherName ? `"Teacher:","${teacherName}"` : '',
        '', // Empty row separator
    ].filter(Boolean);
    
    // Column headers
    const headers = [
        'Student ID',
        'Student Name',
        'Section',
        'Status',
        'Raw Score',
        'Percentage',
        'Transmuted Grade',
        'GPA',
        'Letter Grade',
        'Descriptor',
        'Remarks',
        'Pass/Fail',
    ];
    
    // Data rows
    const dataRows = scores.map(s => {
        const status = s.isAbsent 
            ? (s.isExcused ? 'Excused' : 'Absent') 
            : 'Present';
        
        let percentage = '';
        let transmuted = '';
        let gpa = '';
        let letterGrade = '';
        let descriptor = '';
        let passFail = '';
        
        if (s.score !== null && !s.isAbsent) {
            const gradeResult = calculateGrade(s.score, maxScore, gradingSystem);
            percentage = gradeResult.percentageScore.toFixed(2);
            transmuted = gradeResult.transmutedGrade.toString();
            gpa = gradeResult.gradePoint.toFixed(2);
            letterGrade = gradeResult.letterGrade;
            descriptor = gradeResult.descriptor;
            passFail = gradeResult.remarks;
        } else if (s.isAbsent) {
            passFail = s.isExcused ? 'INC' : 'FAILED';
        }
        
        return [
            s.studentId,
            `"${s.studentName}"`, // Quote names to handle commas
            s.section,
            status,
            s.score !== null ? s.score.toString() : '',
            percentage,
            transmuted,
            gpa,
            letterGrade,
            descriptor,
            s.remarks ? `"${s.remarks}"` : '',
            passFail,
        ].join(',');
    });
    
    // Combine all rows
    return [
        ...metaRows,
        headers.join(','),
        ...dataRows,
    ].join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(
    scores: ExportScoreData[],
    options: ExportOptions,
    filename?: string
): void {
    const csv = exportToCSV(scores, options);
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `${options.examTitle.replace(/\s+/g, '_')}_scores_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Generate HTML for PDF export (printable grade sheet)
 */
export function generatePrintableHTML(
    scores: ExportScoreData[],
    options: ExportOptions
): string {
    const { examTitle, courseTitle, maxScore, gradingSystem, exportDate, teacherName } = options;
    
    // Calculate summary statistics
    const presentScores = scores.filter(s => s.score !== null && !s.isAbsent);
    const absentCount = scores.filter(s => s.isAbsent).length;
    const excusedCount = scores.filter(s => s.isExcused).length;
    
    const avgScore = presentScores.length > 0
        ? presentScores.reduce((sum, s) => sum + (s.score || 0), 0) / presentScores.length
        : 0;
    
    const passingCount = presentScores.filter(s => {
        const grade = calculateGrade(s.score!, maxScore, gradingSystem);
        return grade.remarks === 'PASSED';
    }).length;
    
    const passingRate = presentScores.length > 0
        ? (passingCount / presentScores.length) * 100
        : 0;
    
    // Generate table rows
    const tableRows = scores.map((s, index) => {
        const status = s.isAbsent 
            ? (s.isExcused ? 'EXC' : 'ABS') 
            : 'P';
        
        let transmuted = '-';
        let gpa = '-';
        let passFail = '-';
        let passFailColor = '#64748b';
        
        if (s.score !== null && !s.isAbsent) {
            const gradeResult = calculateGrade(s.score, maxScore, gradingSystem);
            transmuted = gradeResult.transmutedGrade.toString();
            gpa = gradeResult.gradePoint.toFixed(2);
            passFail = gradeResult.remarks;
            passFailColor = gradeResult.remarks === 'PASSED' ? '#10b981' : '#ef4444';
        } else if (s.isAbsent) {
            passFail = s.isExcused ? 'INC' : 'FAILED';
            passFailColor = s.isExcused ? '#f59e0b' : '#ef4444';
        }
        
        return `
            <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${index + 1}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${s.studentId}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${s.studentName}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">
                    <span style="padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;
                        background: ${status === 'P' ? '#dcfce7' : status === 'EXC' ? '#fef3c7' : '#fee2e2'};
                        color: ${status === 'P' ? '#166534' : status === 'EXC' ? '#92400e' : '#991b1b'};">
                        ${status}
                    </span>
                </td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 600;">
                    ${s.score !== null ? s.score : '-'}
                </td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: #3b82f6;">
                    ${transmuted}
                </td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">
                    ${gpa}
                </td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 600; color: ${passFailColor};">
                    ${passFail}
                </td>
            </tr>
        `;
    }).join('');
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${examTitle} - Grade Sheet</title>
    <style>
        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            color: #0f172a;
            font-size: 12px;
        }
        .header {
            text-align: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid #3b82f6;
        }
        .header h1 {
            margin: 0 0 4px 0;
            font-size: 18px;
            color: #1e40af;
        }
        .header h2 {
            margin: 0 0 8px 0;
            font-size: 14px;
            font-weight: 500;
            color: #64748b;
        }
        .meta-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 16px;
            padding: 12px 16px;
            background: #f1f5f9;
            border-radius: 8px;
        }
        .meta-item {
            text-align: center;
        }
        .meta-label {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .meta-value {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th {
            background: #1e40af;
            color: white;
            padding: 10px 12px;
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        th:not(:first-child) {
            text-align: center;
        }
        .summary {
            display: flex;
            gap: 16px;
            margin-top: 20px;
            padding: 16px;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        .summary-item {
            flex: 1;
            text-align: center;
            padding: 8px;
        }
        .summary-value {
            font-size: 20px;
            font-weight: 700;
        }
        .summary-label {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
        }
        .signature-section {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
        }
        .signature-box {
            width: 200px;
            text-align: center;
        }
        .signature-line {
            border-top: 1px solid #0f172a;
            margin-top: 40px;
            padding-top: 4px;
            font-size: 11px;
        }
        .print-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
        }
        .print-btn:hover {
            background: #2563eb;
        }
    </style>
</head>
<body>
    <button class="print-btn no-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
    
    <div class="header">
        <h1>${courseTitle}</h1>
        <h2>${examTitle}</h2>
        <div style="font-size: 11px; color: #94a3b8;">
            Generated: ${exportDate.toLocaleDateString('en-PH', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}
        </div>
    </div>
    
    <div class="meta-info">
        <div class="meta-item">
            <div class="meta-label">Max Score</div>
            <div class="meta-value">${maxScore}</div>
        </div>
        <div class="meta-item">
            <div class="meta-label">Grading System</div>
            <div class="meta-value">${gradingSystem.toUpperCase()}</div>
        </div>
        <div class="meta-item">
            <div class="meta-label">Total Students</div>
            <div class="meta-value">${scores.length}</div>
        </div>
        <div class="meta-item">
            <div class="meta-label">Present</div>
            <div class="meta-value">${presentScores.length}</div>
        </div>
        <div class="meta-item">
            <div class="meta-label">Absent</div>
            <div class="meta-value">${absentCount - excusedCount}</div>
        </div>
        <div class="meta-item">
            <div class="meta-label">Excused</div>
            <div class="meta-value">${excusedCount}</div>
        </div>
    </div>
    
    <table>
        <thead>
            <tr>
                <th style="width: 40px;">#</th>
                <th style="width: 100px;">Student ID</th>
                <th>Student Name</th>
                <th style="width: 60px;">Status</th>
                <th style="width: 70px;">Score</th>
                <th style="width: 70px;">Grade</th>
                <th style="width: 60px;">GPA</th>
                <th style="width: 80px;">Remarks</th>
            </tr>
        </thead>
        <tbody>
            ${tableRows}
        </tbody>
    </table>
    
    <div class="summary">
        <div class="summary-item">
            <div class="summary-value" style="color: #3b82f6;">${avgScore.toFixed(1)}</div>
            <div class="summary-label">Class Average</div>
        </div>
        <div class="summary-item">
            <div class="summary-value" style="color: #10b981;">${passingCount}</div>
            <div class="summary-label">Passed</div>
        </div>
        <div class="summary-item">
            <div class="summary-value" style="color: #ef4444;">${presentScores.length - passingCount}</div>
            <div class="summary-label">Failed</div>
        </div>
        <div class="summary-item">
            <div class="summary-value" style="color: ${passingRate >= 75 ? '#10b981' : '#ef4444'};">${passingRate.toFixed(1)}%</div>
            <div class="summary-label">Passing Rate</div>
        </div>
    </div>
    
    <div class="signature-section">
        <div class="signature-box">
            <div class="signature-line">${teacherName || 'Instructor'}</div>
        </div>
        <div class="signature-box">
            <div class="signature-line">Department Head</div>
        </div>
        <div class="signature-box">
            <div class="signature-line">Date</div>
        </div>
    </div>
</body>
</html>
    `;
}

/**
 * Open printable PDF view in new window
 */
export function openPrintView(
    scores: ExportScoreData[],
    options: ExportOptions
): void {
    const html = generatePrintableHTML(scores, options);
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
    }
}
