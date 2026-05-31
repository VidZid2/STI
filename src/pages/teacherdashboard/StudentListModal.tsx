/**
 * Student List Modal - View all students for teachers
 * Professional minimalistic design matching the app's design system
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { fetchUsers, searchUsers } from '../../services/usersService';
import type { UserAccount } from '../../services/usersService';
import { useDisplaySettings } from '../../contexts/DisplaySettingsContext';
import { exportGradesToExcel, exportGradesToPDF, type ClassGradesSummary } from '../../utils/exportUtils';
import { useResponsive } from './hooks';
import { useFocusTrap } from './hooks';
import { StudentSkeleton, StudentCard, StudentRow, StudentProfilePanel } from './student';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { ModalBackdrop, ModalCloseButton } from './components';
import { StudentListToolbar } from './studentlist';

interface StudentListModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type SortOption = 'name' | 'section' | 'recent';
type ViewMode = 'grid' | 'list';

const StudentListModal: React.FC<StudentListModalProps> = ({ isOpen, onClose }) => {
    // Responsive state for mobile compatibility
    const { isMobile, isSmallMobile } = useResponsive();

    const [students, setStudents] = useState<UserAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('name');
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [selectedStudent, setSelectedStudent] = useState<UserAccount | null>(null);
    const [sectionFilter, setSectionFilter] = useState<string>('all');
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // View toggle tooltip state
    const [viewTooltip, setViewTooltip] = useState<{ visible: boolean; x: number; y: number; type: 'list' | 'grid' }>({ visible: false, x: 0, y: 0, type: 'list' });
    const listBtnRef = useRef<HTMLButtonElement>(null);
    const gridBtnRef = useRef<HTMLButtonElement>(null);

    // Phase 14.2: Focus trap
    const focusTrapRef = useFocusTrap(isOpen);

    // Get display settings
    const { settings: displaySettings, shouldAnimate, shouldShowAvatar } = useDisplaySettings();
    const isCompact = displaySettings.compactView;

    // Fetch students on mount
    useEffect(() => {
        if (isOpen) {
            loadStudents();
        }
    }, [isOpen]);

    const loadStudents = async () => {
        setIsLoading(true);
        try {
            const data = await fetchUsers('student');
            setStudents(data);
        } catch {
            toast.error('Failed to load students');
        } finally {
            setIsLoading(false);
        }
    };

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

    // Handle search
    useEffect(() => {
        const handleSearch = async () => {
            if (searchQuery.trim()) {
                const results = await searchUsers(searchQuery);
                setStudents(results.filter(u => u.role === 'student'));
            } else {
                loadStudents();
            }
        };

        const debounce = setTimeout(handleSearch, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery]);

    // Get unique sections
    const sections = useMemo(() => {
        const sectionSet = new Set(students.map(s => s.section || 'BSIT101A'));
        return Array.from(sectionSet).sort();
    }, [students]);

    // Filter and sort students
    const filteredStudents = useMemo(() => {
        let result = [...students];

        // Filter by section
        if (sectionFilter !== 'all') {
            result = result.filter(s => (s.section || 'BSIT101A') === sectionFilter);
        }

        // Sort
        switch (sortBy) {
            case 'name':
                result.sort((a, b) => a.full_name.localeCompare(b.full_name));
                break;
            case 'section':
                result.sort((a, b) => (a.section || '').localeCompare(b.section || ''));
                break;
            case 'recent':
                result.sort((a, b) => {
                    const dateA = a.last_active ? new Date(a.last_active).getTime() : 0;
                    const dateB = b.last_active ? new Date(b.last_active).getTime() : 0;
                    return dateB - dateA;
                });
                break;
        }

        return result;
    }, [students, sectionFilter, sortBy]);

    // Stats
    const stats = useMemo(() => ({
        total: filteredStudents.length,
        online: filteredStudents.filter(s => s.is_online).length,
    }), [filteredStudents]);

    // Export handler — fetches real grades from student_submissions
    const handleExport = async (format: 'pdf' | 'excel') => {
        setShowExportMenu(false);

        // Fetch real submission scores for the filtered students
        let gradeMap: Record<string, { scores: number[]; avg: number }> = {};

        if (supabase) {
            try {
                const studentIds = filteredStudents.map(s => s.student_id).filter(Boolean);
                const { data: subs } = await supabase
                    .from('student_submissions')
                    .select('student_id, ai_score')
                    .in('student_id', studentIds)
                    .not('ai_score', 'is', null)
                    .limit(2000);

                if (subs) {
                    for (const sub of subs as { student_id: string; ai_score: number }[]) {
                        if (!gradeMap[sub.student_id]) gradeMap[sub.student_id] = { scores: [], avg: 0 };
                        gradeMap[sub.student_id].scores.push(sub.ai_score);
                    }
                    for (const id of Object.keys(gradeMap)) {
                        const scores = gradeMap[id].scores;
                        gradeMap[id].avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
                    }
                }
            } catch {
                // Grade fetch failed — export proceeds with 0 scores for affected students
            }
        }

        const getLetterGrade = (avg: number) => {
            if (avg >= 97) return '1.0';
            if (avg >= 94) return '1.25';
            if (avg >= 91) return '1.5';
            if (avg >= 88) return '1.75';
            if (avg >= 85) return '2.0';
            if (avg >= 82) return '2.25';
            if (avg >= 79) return '2.5';
            if (avg >= 76) return '2.75';
            if (avg >= 75) return '3.0';
            return '5.0';
        };

        const exportData: ClassGradesSummary = {
            courseName: 'Student Directory',
            courseCode: sectionFilter === 'all' ? 'ALL' : sectionFilter,
            section: sectionFilter === 'all' ? 'All Sections' : sectionFilter,
            semester: '1st Semester 2025-2026',
            teacherName: 'Teacher',
            exportDate: new Date().toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
            }),
            assignmentTitles: ['Avg Score'],
            students: filteredStudents.map((student, index) => {
                const grades = gradeMap[student.student_id];
                const avg = grades?.avg ?? 0;
                const scores = grades?.scores ?? [];
                return {
                    rank: index + 1,
                    name: student.full_name,
                    studentId: student.student_id || student.id.slice(0, 8).toUpperCase(),
                    assignments: scores.length > 0 ? [avg] : [0],
                    average: avg,
                    grade: getLetterGrade(avg),
                    remarks: avg >= 75 ? 'PASSED' : avg > 0 ? 'FAILED' : 'NO DATA',
                };
            }),
        };

        if (format === 'pdf') {
            exportGradesToPDF(exportData);
        } else {
            exportGradesToExcel(exportData);
        }
    };

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                if (selectedStudent) {
                    setSelectedStudent(null);
                } else {
                    onClose();
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, selectedStudent]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <ModalBackdrop onClose={onClose} zIndex={9998} blur="6px" background="rgba(15, 23, 42, 0.4)" />

                    {/* Drawer Container */}
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'stretch',
                        justifyContent: 'flex-end',
                        zIndex: 9999,
                        pointerEvents: 'none',
                    }}>
                        <motion.div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="student-list-modal-title"
                            ref={focusTrapRef}
                            initial={{ x: isMobile ? 0 : '100%', y: isMobile ? '100%' : 0 }}
                            animate={{ x: 0, y: 0 }}
                            exit={{ x: isMobile ? 0 : '100%', y: isMobile ? '100%' : 0 }}
                            transition={{ type: 'spring', stiffness: 350, damping: 32 }}
                            style={{
                                width: '100%',
                                maxWidth: isMobile ? '100%' : (selectedStudent ? '1100px' : '650px'),
                                height: '100%',
                                background: 'var(--bg-canvas)',
                                borderLeft: isMobile ? 'none' : '1px solid var(--border-subtle)',
                                borderRadius: isMobile ? '0' : '24px 0 0 24px',
                                boxShadow: isMobile ? 'none' : '-8px 0 32px rgba(0, 0, 0, 0.12)',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                pointerEvents: 'auto',
                                transition: 'max-width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                            }}
                        >
                            {/* Header */}
                            <div style={{
                                padding: isMobile ? '12px 16px' : '20px 24px',
                                background: 'var(--bg-surface)',
                                borderBottom: '1px solid var(--border-subtle)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: isMobile ? '10px' : '16px',
                            }}>
                                <div style={{
                                    width: isMobile ? '40px' : '48px',
                                    height: isMobile ? '40px' : '48px',
                                    borderRadius: isMobile ? '10px' : '14px',
                                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--color-success)',
                                    flexShrink: 0,
                                }}>
                                    <svg width={isMobile ? "20" : "24"} height={isMobile ? "20" : "24"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h2 id="student-list-modal-title" style={{ margin: 0, fontSize: isMobile ? '15px' : '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {isMobile ? 'Students' : 'Student Directory'}
                                    </h2>
                                    <p style={{ margin: '2px 0 0 0', fontSize: isMobile ? '11px' : '13px', color: 'var(--text-secondary)' }}>
                                        {stats.total} students • {stats.online} online
                                    </p>
                                </div>
                                <ModalCloseButton onClose={onClose} size={isMobile ? 32 : 36} />
                            </div>

                            {/* Toolbar — extracted to StudentListToolbar (Phase 12.2) */}
                            <StudentListToolbar
                                isMobile={isMobile}
                                isSmallMobile={isSmallMobile}
                                searchQuery={searchQuery}
                                isSearching={isSearching}
                                handleSearchChange={handleSearchChange}
                                sectionFilter={sectionFilter}
                                setSectionFilter={setSectionFilter}
                                sections={sections}
                                sortBy={sortBy}
                                setSortBy={setSortBy}
                                viewMode={viewMode}
                                setViewMode={setViewMode}
                                viewTooltip={viewTooltip}
                                setViewTooltip={setViewTooltip}
                                listBtnRef={listBtnRef}
                                gridBtnRef={gridBtnRef}
                                showExportMenu={showExportMenu}
                                setShowExportMenu={setShowExportMenu}
                                handleExport={handleExport}
                            />

                            {/* Content */}
                            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: isMobile ? 'column' : 'row' }}>
                                {/* Student List */}
                                <div style={{
                                    flex: 1,
                                    overflow: 'auto',
                                    padding: isMobile ? '12px 16px' : '20px 24px',
                                }}>
                                    {isLoading ? (
                                        <StudentSkeleton viewMode={viewMode} showAvatars={shouldShowAvatar} />
                                    ) : filteredStudents.length === 0 ? (
                                        <div style={{
                                            textAlign: 'center',
                                            padding: '60px 20px',
                                            color: 'var(--text-secondary)',
                                        }}>
                                            <div style={{
                                                width: '64px',
                                                height: '64px',
                                                borderRadius: '16px',
                                                background: 'rgba(0,0,0,0.04)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                margin: '0 auto 16px',
                                            }}>
                                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2">
                                                    <circle cx="11" cy="11" r="8" />
                                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                                </svg>
                                            </div>
                                            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                No students found
                                            </h3>
                                            <p style={{ margin: 0, fontSize: '13px' }}>
                                                Try adjusting your search or filter criteria
                                            </p>
                                        </div>
                                    ) : viewMode === 'grid' && !isMobile ? (
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: `repeat(auto-fill, minmax(${isCompact ? '180px' : '200px'}, 1fr))`,
                                            gap: isCompact ? '12px' : '16px',
                                        }}>
                                            {filteredStudents.map((student, index) => (
                                                <StudentCard
                                                    key={student.id}
                                                    student={student}
                                                    index={index}
                                                    onViewProfile={setSelectedStudent}
                                                    showAvatars={shouldShowAvatar}
                                                    shouldAnimate={shouldAnimate && !isMobile}
                                                    isCompact={isCompact}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '4px' : (isCompact ? '4px' : '8px') }}>
                                            {filteredStudents.map((student, index) => (
                                                <StudentRow
                                                    key={student.id}
                                                    student={student}
                                                    index={index}
                                                    onViewProfile={isMobile ? undefined : setSelectedStudent}
                                                    showAvatars={shouldShowAvatar}
                                                    shouldAnimate={shouldAnimate && !isMobile}
                                                    isCompact={isCompact || isMobile}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Profile Panel - hide on mobile */}
                                {!isMobile && (
                                    <AnimatePresence>
                                        {selectedStudent && (
                                            <StudentProfilePanel
                                                student={selectedStudent}
                                                onClose={() => setSelectedStudent(null)}
                                                showAvatars={shouldShowAvatar}
                                                shouldAnimate={shouldAnimate}
                                            />
                                        )}
                                    </AnimatePresence>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default StudentListModal;
