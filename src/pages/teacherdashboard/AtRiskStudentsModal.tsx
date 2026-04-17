/**
 * At-Risk Students Modal
 * Fetches real student data from Supabase database
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDisplaySettings } from '../../contexts/DisplaySettingsContext';
import { AtRiskSkeleton, AtRiskFilterTabs, AtRiskStudentCard } from './atrisk';
import type { AtRiskFilterType, AtRiskStudent } from './atrisk';
import { ModalBackdrop, ModalCloseButton, ModalSearchInput, ModalContainer } from './components';
import { fetchAtRiskStudents } from '../../services/atRiskService';
import { toast } from 'sonner';
import { useFocusTrap } from './hooks';

interface AtRiskStudentsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ACCENT_COLOR = '#3b82f6';

const AtRiskStudentsModal: React.FC<AtRiskStudentsModalProps> = ({ isOpen, onClose }) => {
    const [students, setStudents] = useState<AtRiskStudent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [activeFilter, setActiveFilter] = useState<AtRiskFilterType>('all');
    const [error, setError] = useState<string | null>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const focusTrapRef = useFocusTrap(isOpen);

    const { settings: displaySettings, shouldAnimate, shouldShowAvatar } = useDisplaySettings();
    const isCompact = displaySettings.compactView;

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

    useEffect(() => () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); }, []);

    const fetchStudents = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchAtRiskStudents();
            setStudents(data);
        } catch {
            toast.error('Failed to fetch at-risk students');
            setError('Failed to load students. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { if (isOpen) fetchStudents(); }, [isOpen, fetchStudents]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) { document.addEventListener('keydown', handleEscape); document.body.style.overflow = 'hidden'; }
        return () => { document.removeEventListener('keydown', handleEscape); document.body.style.overflow = ''; };
    }, [isOpen, onClose]);

    const filteredStudents = students.filter(s => {
        const q = searchQuery.toLowerCase();
        const match = s.full_name.toLowerCase().includes(q) || s.student_id.toLowerCase().includes(q);
        if (!match) return false;
        switch (activeFilter) {
            case 'low-grades': return s.currentGrade < 75;
            case 'absences': return s.absences >= 5;
            case 'missing-work': return s.issue.toLowerCase().includes('missing');
            default: return true;
        }
    });

    const counts = {
        all: students.length,
        lowGrades: students.filter(s => s.currentGrade < 75).length,
        absences: students.filter(s => s.absences >= 5).length,
        missingWork: students.filter(s => s.issue.toLowerCase().includes('missing')).length,
    };

    const handleSendEmail = (student: AtRiskStudent) => {
        window.location.href = `mailto:${student.email}?subject=Academic Performance - ${student.full_name}`;
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <ModalBackdrop onClose={onClose} zIndex={1000} />
                    <div className="fixed inset-0 flex items-center justify-center z-[1001] p-5 pointer-events-none">
                        <ModalContainer maxWidth="800px" style={{ pointerEvents: 'auto' }} labelledById="atrisk-modal-title">
                            <div ref={focusTrapRef} className="flex flex-col h-full">
                                {/* Header */}
                                <div className="px-6 py-6" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                                                style={{ background: 'var(--color-danger-bg)', border: '1px solid rgba(239,68,68,0.25)', color: 'var(--color-danger)' }}>
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                                    <circle cx="9" cy="7" r="4" />
                                                    <line x1="19" y1="8" x2="19" y2="14" /><line x1="19" y1="18" x2="19.01" y2="18" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h2 id="atrisk-modal-title" className="text-base font-semibold m-0" style={{ color: 'var(--text-primary)' }}>
                                                    Students Needing Attention
                                                </h2>
                                                <p className="text-xs m-0 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                                    {students.length} students may need intervention
                                                </p>
                                            </div>
                                        </div>
                                        <ModalCloseButton onClose={onClose} />
                                    </div>
                                    <div className="flex gap-2 flex-wrap items-center">
                                        <ModalSearchInput value={searchQuery} onChange={handleSearchChange} onClear={() => setSearchQuery('')}
                                            placeholder="Search students..." isSearching={isSearching} ariaLabel="Search students by name or ID" />
                                        <AtRiskFilterTabs activeFilter={activeFilter} setActiveFilter={setActiveFilter} counts={counts} />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-auto p-6">
                                    {isLoading || isSearching ? (
                                        <div className="flex flex-col gap-2">
                                            {Array.from({ length: isSearching ? 3 : 5 }).map((_, i) => <AtRiskSkeleton key={i} />)}
                                        </div>
                                    ) : error ? (
                                        <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="1.5" className="mx-auto mb-4 opacity-50">
                                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                            </svg>
                                            <p className="m-0 mb-3">{error}</p>
                                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={fetchStudents}
                                                className="px-4 py-2 rounded-lg text-xs font-medium cursor-pointer border-none text-white"
                                                style={{ background: ACCENT_COLOR }}>
                                                Try Again
                                            </motion.button>
                                        </div>
                                    ) : filteredStudents.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-8" style={{ color: 'var(--text-secondary)' }}>
                                            <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center mb-4"
                                                style={{ background: searchQuery ? 'var(--accent-bg)' : 'var(--color-success-bg)' }}>
                                                {searchQuery ? (
                                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={ACCENT_COLOR} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /><path d="M8 8l6 6M14 8l-6 6" />
                                                    </svg>
                                                ) : (
                                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                                                    </svg>
                                                )}
                                            </div>
                                            <p className="m-0 text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                                                {searchQuery ? 'No students found' : 'All students are doing well!'}
                                            </p>
                                            <p className="mt-1 mb-0 text-xs text-center">
                                                {searchQuery ? 'Try a different search term' : 'No students need immediate attention'}
                                            </p>
                                        </div>
                                    ) : (
                                        <motion.div layout className="flex flex-col" style={{ gap: isCompact ? '6px' : '8px' }}>
                                            <AnimatePresence mode="popLayout">
                                                {filteredStudents.map((student, index) => (
                                                    <AtRiskStudentCard key={student.id} student={student} index={index}
                                                        onViewDetails={() => {}} onSendEmail={handleSendEmail}
                                                        showAvatars={shouldShowAvatar} shouldAnimate={shouldAnimate} isCompact={isCompact} />
                                                ))}
                                            </AnimatePresence>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between px-6 py-3" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
                                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                        Showing {filteredStudents.length} of {students.length} students
                                    </div>
                                    <div className="flex gap-2">
                                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClose}
                                            className="px-5 py-2 rounded-lg text-xs font-medium cursor-pointer"
                                            style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                                            Close
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.02, boxShadow: `0 8px 20px ${ACCENT_COLOR}30` }}
                                            whileTap={{ scale: 0.98 }}
                                            className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-medium cursor-pointer border-none text-white"
                                            style={{ background: `linear-gradient(135deg, ${ACCENT_COLOR} 0%, #2563eb 100%)`, boxShadow: `0 4px 12px ${ACCENT_COLOR}25` }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                                            </svg>
                                            Export Report
                                        </motion.button>
                                    </div>
                                </div>
                            </div>
                        </ModalContainer>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AtRiskStudentsModal;
