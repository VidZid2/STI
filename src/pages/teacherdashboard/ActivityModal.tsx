/**
 * Activity Modal
 * Professional minimalistic design matching GroupsContent/AtRiskStudentsModal
 * Fetches real activity data from Supabase database (student_submissions)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { ActivitySkeleton, ActivityFilterTabs, ActivityCard } from './activity';
import type { ActivityFilterType, ActivityItem } from './activity';
import { ModalBackdrop, ModalCloseButton, ModalSearchInput, ModalContainer } from './components';
import { useFocusTrap } from './hooks';

interface ActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ACCENT_COLOR = '#3b82f6';

const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const ActivityModal: React.FC<ActivityModalProps> = ({ isOpen, onClose }) => {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [activeFilter, setActiveFilter] = useState<ActivityFilterType>('all');
    const [error, setError] = useState<string | null>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const focusTrapRef = useFocusTrap(isOpen);

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

    const fetchActivities = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (!supabase) { setActivities([]); setIsLoading(false); return; }
            const { data: submissions, error: fetchError } = await supabase
                .from('student_submissions')
                .select('id, student_id, student_name, task_id, status, submitted_at, score')
                .order('submitted_at', { ascending: false })
                .limit(100);

            if (fetchError) {
                const msg = fetchError.message || String(fetchError);
                if (['relation', 'does not exist', 'permission denied', 'JWT', 'Failed to fetch', 'NetworkError', 'Load failed', 'FetchError'].some(k => msg.includes(k))) {
                    setActivities([]); setIsLoading(false); return;
                }
                throw new Error(msg);
            }
            if (!submissions || submissions.length === 0) { setActivities([]); setIsLoading(false); return; }

            const taskIds = [...new Set(submissions.map(s => s.task_id).filter(Boolean))];
            let taskMap = new Map();
            if (taskIds.length > 0) {
                const { data: tasks } = await supabase.from('course_tasks').select('id, course_id, title').in('id', taskIds);
                taskMap = new Map(tasks?.map(t => [t.id, t]) || []);
            }

            setActivities(submissions.map((sub) => {
                const task = taskMap.get(sub.task_id);
                let action = 'New submission';
                let type: ActivityItem['type'] = 'submission';
                if (sub.status === 'graded') { action = 'Submission graded'; type = 'grade'; }
                else if (sub.status === 'late') { action = 'Late submission'; type = 'late'; }
                else if (sub.status === 'pending') { action = 'Pending review'; type = 'pending'; }
                return {
                    id: sub.id, action, student: sub.student_name || 'Unknown Student',
                    studentId: sub.student_id, course: task?.course_id?.toUpperCase() || 'Course',
                    taskTitle: task?.title || '', time: formatTimeAgo(new Date(sub.submitted_at)),
                    timestamp: new Date(sub.submitted_at), type, score: sub.score ?? undefined, status: sub.status,
                };
            }));
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            if (['Failed to fetch', 'NetworkError', 'net::ERR_', 'Load failed', 'ENOTFOUND', 'no such host'].some(k => msg.includes(k))) {
                setActivities([]);
            } else {
                setError(`Failed to load activities: ${msg}`);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { if (isOpen) fetchActivities(); }, [isOpen, fetchActivities]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) { document.addEventListener('keydown', handleEscape); document.body.style.overflow = 'hidden'; }
        return () => { document.removeEventListener('keydown', handleEscape); document.body.style.overflow = ''; };
    }, [isOpen, onClose]);

    const filteredActivities = activities.filter(a => {
        const q = searchQuery.toLowerCase();
        const match = a.student.toLowerCase().includes(q) || a.course.toLowerCase().includes(q) || a.taskTitle.toLowerCase().includes(q);
        if (!match) return false;
        switch (activeFilter) {
            case 'submissions': return a.type === 'submission';
            case 'graded': return a.type === 'grade';
            case 'late': return a.type === 'late';
            case 'pending': return a.type === 'pending';
            default: return true;
        }
    });

    const counts = {
        all: activities.length,
        submissions: activities.filter(a => a.type === 'submission').length,
        graded: activities.filter(a => a.type === 'grade').length,
        late: activities.filter(a => a.type === 'late').length,
        pending: activities.filter(a => a.type === 'pending').length,
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <ModalBackdrop onClose={onClose} zIndex={1000} />
                    <div className="fixed inset-0 flex items-center justify-center z-[1001] p-5 pointer-events-none">
                        <ModalContainer maxWidth="900px" style={{ pointerEvents: 'auto' }} labelledById="activity-modal-title">
                            <div ref={focusTrapRef} className="flex flex-col h-full">
                                {/* Header */}
                                <div className="px-6 py-6" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <motion.div
                                                whileHover={{ scale: 1.05, rotate: 5 }}
                                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                                className="w-11 h-11 rounded-xl flex items-center justify-center"
                                                style={{ background: `linear-gradient(135deg, ${ACCENT_COLOR}15 0%, ${ACCENT_COLOR}08 100%)`, border: `1px solid ${ACCENT_COLOR}25`, color: ACCENT_COLOR }}
                                            >
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                                </svg>
                                            </motion.div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h2 id="activity-modal-title" className="text-base font-semibold m-0" style={{ color: 'var(--text-primary)' }}>All Activity</h2>
                                                    <span className="px-2 py-[3px] rounded-md text-[11px] font-semibold" style={{ background: 'var(--accent-bg)', color: ACCENT_COLOR }}>
                                                        {activities.length} items
                                                    </span>
                                                </div>
                                                <p className="text-xs m-0 mt-0.5" style={{ color: 'var(--text-secondary)' }}>Recent submissions and grading activity</p>
                                            </div>
                                        </div>
                                        <ModalCloseButton onClose={onClose} />
                                    </div>
                                    <div className="flex gap-2 flex-wrap items-center">
                                        <ModalSearchInput value={searchQuery} onChange={handleSearchChange} onClear={() => setSearchQuery('')}
                                            placeholder="Search by student, course, or task..." isSearching={isSearching}
                                            ariaLabel="Search activities by student, course, or task" />
                                        <ActivityFilterTabs activeFilter={activeFilter} setActiveFilter={setActiveFilter} counts={counts} />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto p-6">
                                    {isLoading || isSearching ? (
                                        <div className="flex flex-col gap-2">
                                            {Array.from({ length: isSearching ? 3 : 6 }).map((_, i) => <ActivitySkeleton key={i} />)}
                                        </div>
                                    ) : error ? (
                                        <div className="flex flex-col items-center justify-center py-8 text-center">
                                            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--color-danger-bg)' }}>
                                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                                </svg>
                                            </div>
                                            <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>{error}</p>
                                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={fetchActivities}
                                                className="px-4 py-2 rounded-lg text-xs font-medium cursor-pointer border-none text-white"
                                                style={{ background: ACCENT_COLOR }}>
                                                Try Again
                                            </motion.button>
                                        </div>
                                    ) : filteredActivities.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-8 text-center">
                                            <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center mb-4"
                                                style={{ background: `linear-gradient(135deg, ${ACCENT_COLOR}15 0%, ${ACCENT_COLOR}05 100%)`, border: `1px solid ${ACCENT_COLOR}20` }}>
                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={ACCENT_COLOR} strokeWidth="1.5">
                                                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                                </svg>
                                            </div>
                                            <h3 className="text-[13px] font-semibold m-0 mb-1" style={{ color: 'var(--text-primary)' }}>
                                                {searchQuery ? 'No matching activity' : 'No activity yet'}
                                            </h3>
                                            <p className="text-xs m-0" style={{ color: 'var(--text-secondary)' }}>
                                                {searchQuery ? 'Try adjusting your search or filters' : 'Activity will appear here when students submit work'}
                                            </p>
                                        </div>
                                    ) : (
                                        <AnimatePresence mode="popLayout">
                                            <div className="flex flex-col gap-2">
                                                {filteredActivities.map((activity, index) => (
                                                    <ActivityCard key={activity.id} activity={activity} index={index} />
                                                ))}
                                            </div>
                                        </AnimatePresence>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between px-6 py-3" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
                                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                        Showing {filteredActivities.length} of {activities.length} activities
                                    </span>
                                    <motion.button
                                        className="dashboard-btn flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-medium cursor-pointer"
                                        whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(59,130,246,0.2)' }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={fetchActivities}
                                        style={{ background: 'var(--accent-bg)', color: ACCENT_COLOR, border: `1px solid ${ACCENT_COLOR}33` }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
                                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                        </svg>
                                        Refresh
                                    </motion.button>
                                </div>
                            </div>
                        </ModalContainer>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ActivityModal;
