/**
 * CourseAssignmentsTab
 * The assignments/tasks tab content for CourseViewPage.
 * Extracted from CourseViewPage.tsx during Phase 8.1 continuation.
 */
import * as React from 'react';
import { motion } from 'motion/react';
import { getCurrentUser } from '../../../../../services/authService';
import { supabase } from '../../../../../lib/supabase';
import { EmptyState } from '../components/SharedComponents';
import { PreviewIconWithTooltip } from '../components/PreviewIconWithTooltip';
import type { CourseTask, TaskCategory } from '../data/demoCourses';

const TASK_CATEGORIES: { id: TaskCategory; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'all', label: 'All', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>, color: 'zinc' },
    { id: 'assignment', label: 'Assignments', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>, color: 'emerald' },
    { id: 'performance', label: 'Performance', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></svg>, color: 'purple' },
    { id: 'quiz', label: 'Quizzes', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /></svg>, color: 'amber' },
    { id: 'practical', label: 'Practical', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>, color: 'rose' },
    { id: 'journal', label: 'Journals', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>, color: 'cyan' },
    { id: 'overdue', label: 'Overdue', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>, color: 'red' },
];

export interface CourseAssignmentsTabProps {
    course: { id: string; title: string; subtitle: string; image: string; progress: number; instructor?: string };
    isLoading: boolean;
    courseTasks: CourseTask[];
    taskFilter: TaskCategory;
    setTaskFilter: (f: TaskCategory) => void;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    isSearching: boolean;
    systemConfig: { submissions_enabled: boolean };
    showAddTaskModal: boolean;
    setShowAddTaskModal: (v: boolean) => void;
    refetchTasks: () => Promise<void>;
}

export const CourseAssignmentsTab: React.FC<CourseAssignmentsTabProps> = ({
    course,
    isLoading,
    courseTasks,
    taskFilter,
    setTaskFilter,
    searchQuery,
    setSearchQuery,
    isSearching: _isSearching,
    systemConfig,
    showAddTaskModal: _showAddTaskModal,
    setShowAddTaskModal: _setShowAddTaskModal,
    refetchTasks: _refetchTasks,
}) => {
    const [_submitModalTask, setSubmitModalTask] = React.useState<CourseTask | null>(null);
    const [_instructionsTask, setInstructionsTask] = React.useState<CourseTask | null>(null);
    const [_tasksPage, _setTasksPage] = React.useState(1);
    const [_contactTooltip, setContactTooltip] = React.useState<{ visible: boolean; x: number; y: number }>({ visible: false, x: 0, y: 0 });
    const tasksScrollRef = React.useRef<HTMLDivElement>(null);

    // Filter tasks
    const filteredTasks = React.useMemo(() => {
        let tasks = courseTasks;
        if (taskFilter !== 'all' && taskFilter !== 'overdue') {
            tasks = tasks.filter(t => t.category === taskFilter);
        } else if (taskFilter === 'overdue') {
            tasks = tasks.filter(t => t.status === 'overdue' || t.due?.toLowerCase().includes('overdue'));
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            tasks = tasks.filter(t => t.title.toLowerCase().includes(q));
        }
        return tasks;
    }, [courseTasks, taskFilter, searchQuery]);

                if (isLoading) {
                    return (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                            {/* Filter skeleton */}
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {[0, 1, 2, 3, 4, 5].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="h-8 w-28 bg-zinc-100 rounded-lg flex-shrink-0"
                                        animate={{ opacity: [0.5, 0.8, 0.5] }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                                    />
                                ))}
                            </div>
                            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                                {[0, 1, 2, 3].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="flex-shrink-0 w-56 h-44 bg-zinc-100 rounded-xl"
                                        animate={{ opacity: [0.5, 0.8, 0.5] }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    );
                }

                // Get counts for each task category
                const getTaskCategoryCount = (cat: TaskCategory) => {
                    if (cat === 'all') {
                        return courseTasks.filter((t: CourseTask) => {
                            if ((t.status === 'overdue' && (t._diffDays ?? 0) < -7) || t.status === 'locked') return false;
                            return true;
                        }).length;
                    }
                    if (cat === 'overdue') {
                        return courseTasks.filter((t: CourseTask) => {
                            const isOverdueDemo = t.due?.toLowerCase().includes('overdue');
                            let isRealtimeOverdue = false;
                            if (t.id && t.dueDate) {
                                const dueDate = new Date(t.dueDate);
                                if (new Date() > dueDate && t.status !== 'submitted') {
                                    isRealtimeOverdue = true;
                                }
                            }
                            return isOverdueDemo || isRealtimeOverdue || t.status === 'locked';
                        }).length;
                    }
                    return courseTasks.filter((t: { category: TaskCategory }) => t.category === cat).length;
                };

                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                        {/* Container matching modules section design */}
                        <div className="p-4 rounded-2xl bg-white border border-zinc-100 shadow-sm">
                            {/* Task Category Filter - Centered */}
                            <div className="flex justify-center">
                                <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-zinc-50 border border-zinc-100">
                                    {TASK_CATEGORIES.map((cat) => {
                                        const count = getTaskCategoryCount(cat.id);
                                        const isActive = taskFilter === cat.id;

                                        return (
                                            <motion.button
                                                key={cat.id}
                                                onClick={() => setTaskFilter(cat.id)}
                                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${isActive
                                                    ? 'bg-white text-blue-600 shadow-sm border border-blue-100'
                                                    : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100'
                                                    }`}
                                                whileTap={{ scale: 0.97 }}
                                            >
                                                <span className={isActive ? 'text-blue-500' : 'text-zinc-400'}>{cat.icon}</span>
                                                {cat.label}
                                                {count > 0 && (
                                                    <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${isActive ? 'bg-blue-50 text-blue-600' : 'bg-zinc-100 text-zinc-500'
                                                        }`}>
                                                        {count}
                                                    </span>
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Task List */}
                        {filteredTasks.length === 0 ? (
                            <EmptyState
                                icon={
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                        <path d="M9 11l3 3L22 4" />
                                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                    </svg>
                                }
                                title={taskFilter !== 'all' ? `No ${TASK_CATEGORIES.find(c => c.id === taskFilter)?.label.toLowerCase()} found` : "No tasks found"}
                                description={searchQuery ? `No tasks match "${searchQuery}"` : taskFilter !== 'all' ? `No ${TASK_CATEGORIES.find(c => c.id === taskFilter)?.label.toLowerCase()} yet` : "You're all caught up!"}
                                action={(searchQuery || taskFilter !== 'all') ? {
                                    label: searchQuery ? 'Clear search' : 'Show all',
                                    onClick: () => { setSearchQuery(''); setTaskFilter('all'); }
                                } : undefined}
                            />
                        ) : (
                            <div
                                ref={tasksScrollRef}
                                className="flex gap-4 overflow-x-auto pt-4 pb-12 -mx-6 px-6 snap-x snap-mandatory scroll-smooth"
                                style={{ scrollPaddingLeft: '24px' }}
                            >
                                {filteredTasks.map((task, index) => {
                                    const categoryConfig = TASK_CATEGORIES.find(c => c.id === task.category);

                                    // Color configs matching teacher preview
                                    const typeColors: Record<string, { bg: string; text: string; border: string }> = {
                                        assignment: { bg: 'rgba(16, 185, 129, 0.1)', text: '#059669', border: 'rgba(16, 185, 129, 0.2)' },
                                        performance: { bg: 'rgba(139, 92, 246, 0.1)', text: '#7c3aed', border: 'rgba(139, 92, 246, 0.2)' },
                                        quiz: { bg: 'rgba(245, 158, 11, 0.1)', text: '#d97706', border: 'rgba(245, 158, 11, 0.2)' },
                                        practical: { bg: 'rgba(244, 63, 94, 0.1)', text: '#e11d48', border: 'rgba(244, 63, 94, 0.2)' },
                                        journal: { bg: 'rgba(6, 182, 212, 0.1)', text: '#0891b2', border: 'rgba(6, 182, 212, 0.2)' },
                                    };

                                    const typeColor = typeColors[task.category] || typeColors.assignment;

                                    let isOverdue = task.due.toLowerCase().includes('overdue');
                                    const taskAny = task as any;
                                    if (taskAny.id && taskAny.due_date) {
                                        const dueDate = new Date(taskAny.due_date);
                                        if (new Date() > dueDate && task.status !== 'submitted') {
                                            isOverdue = true;
                                        }
                                    }
                                    const studentSection = getCurrentUser()?.section || 'BSIT101A';

                                    return (
                                        <motion.div
                                            key={task.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
                                            whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(59, 130, 246, 0.15)' }}
                                            style={{
                                                flexShrink: 0,
                                                width: '320px',
                                                borderRadius: '20px',
                                                border: '1px solid rgba(59, 130, 246, 0.12)',
                                                background: '#fff',
                                                cursor: 'pointer',
                                                position: 'relative',
                                                scrollSnapAlign: 'start',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                overflow: 'hidden'
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                            }}
                                        >
                                            {/* Completed Badge */}
                                            {(task.status === 'submitted' || task.status === 'resubmitted' || task.status === 'graded' || (task.score !== null && task.score !== undefined && Number(task.score) > 0)) && (
                                                <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 2 }}>
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        whileHover={{ scale: 1.05, boxShadow: task.status === 'resubmitted' ? '0 4px 12px rgba(168, 85, 247, 0.25)' : '0 4px 12px rgba(16, 185, 129, 0.25)' }}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            padding: '4px 10px',
                                                            background: 'rgba(255, 255, 255, 0.9)',
                                                            backdropFilter: 'blur(8px)',
                                                            border: task.status === 'resubmitted' ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                                                            borderRadius: '20px',
                                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                                                            cursor: 'default'
                                                        }}
                                                    >
                                                        {task.status === 'resubmitted' ? (
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="1 4 1 10 7 10"></polyline>
                                                                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                                                            </svg>
                                                        ) : (
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M20 6L9 17l-5-5" />
                                                            </svg>
                                                        )}
                                                        <span style={{ fontSize: '10px', fontWeight: 700, color: task.status === 'resubmitted' ? '#a855f7' : '#10b981', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                                            {task.status === 'resubmitted' ? 'Resubmitted' : 'Completed'}
                                                        </span>
                                                    </motion.div>
                                                </div>
                                            )}

                                            {/* Contact Teacher icon – top right corner for overdue tasks */}
                                            {isOverdue && (
                                                <div
                                                    style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2 }}
                                                    onMouseEnter={(e) => {
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        setContactTooltip({
                                                            visible: true,
                                                            x: rect.left + rect.width / 2,
                                                            y: rect.bottom + 10,
                                                        });
                                                    }}
                                                    onMouseLeave={() => {
                                                        setContactTooltip(prev => ({ ...prev, visible: false }));
                                                    }}
                                                >
                                                    <motion.button
                                                        whileHover={{ scale: 1.12, boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)' }}
                                                        whileTap={{ scale: 0.92 }}
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            try {
                                                                const client = supabase;
                                                                if (!client) {
                                                                    window.location.href = `mailto:Testing@testing?subject=Regarding Overdue Task: ${task.title}`;
                                                                    return;
                                                                }
                                                                const { data } = await client
                                                                    .from('users')
                                                                    .select('email')
                                                                    .eq('email', 'Testing@testing')
                                                                    .single();
                                                                if (data && data.email) {
                                                                    window.location.href = `mailto:${data.email}?subject=Regarding Overdue Task: ${task.title}`;
                                                                } else {
                                                                    window.location.href = `mailto:Testing@testing?subject=Regarding Overdue Task: ${task.title}`;
                                                                }
                                                            } catch (err) {
                                                                window.location.href = `mailto:Testing@testing?subject=Regarding Overdue Task: ${task.title}`;
                                                            }
                                                        }}
                                                        style={{
                                                            width: '34px',
                                                            height: '34px',
                                                            borderRadius: '10px',
                                                            background: 'rgba(239, 68, 68, 0.08)',
                                                            border: '1px solid rgba(239, 68, 68, 0.18)',
                                                            color: '#dc2626',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer',
                                                            padding: 0
                                                        }}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                                            <polyline points="22,6 12,13 2,6" />
                                                        </svg>
                                                    </motion.button>
                                                </div>
                                            )}
                                            <div style={{ padding: '24px 20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1 }}>
                                                {/* Large Icon at Top with Gradient */}
                                                <div style={{
                                                    width: '56px', height: '56px', borderRadius: '14px',
                                                    background: task.category === 'quiz' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : task.category === 'performance' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : task.category === 'journal' || task.category === 'practical' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    marginBottom: '12px',
                                                    boxShadow: task.category === 'quiz' ? '0 8px 20px rgba(245, 158, 11, 0.25)' : task.category === 'performance' ? '0 8px 20px rgba(16, 185, 129, 0.25)' : task.category === 'journal' || task.category === 'practical' ? '0 8px 20px rgba(239, 68, 68, 0.25)' : '0 8px 20px rgba(59, 130, 246, 0.25)'
                                                }}>
                                                    {task.category === 'quiz' ? (
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                                            <line x1="12" y1="17" x2="12.01" y2="17" />
                                                        </svg>
                                                    ) : task.category === 'performance' ? (
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <circle cx="12" cy="12" r="6" />
                                                            <circle cx="12" cy="12" r="2" />
                                                        </svg>
                                                    ) : task.category === 'journal' || task.category === 'practical' ? (
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                                                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                                            <line x1="9" y1="7" x2="17" y2="7" />
                                                            <line x1="9" y1="11" x2="15" y2="11" />
                                                        </svg>
                                                    ) : (
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                            <polyline points="14 2 14 8 20 8" />
                                                            <line x1="16" y1="13" x2="8" y2="13" />
                                                            <line x1="16" y1="17" x2="8" y2="17" />
                                                        </svg>
                                                    )}
                                                </div>

                                                {/* Type Badge */}
                                                <span style={{
                                                    padding: '5px 12px', borderRadius: '8px',
                                                    background: typeColor.bg, border: `1px solid ${typeColor.border}`,
                                                    color: typeColor.text, fontSize: '10px', fontWeight: 600,
                                                    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px'
                                                }}>
                                                    {categoryConfig?.label || 'Assignment'}
                                                </span>

                                                {/* Title */}
                                                <h3 style={{
                                                    margin: '0 0 6px 0', fontSize: '15px', fontWeight: 600, color: '#1e293b',
                                                    lineHeight: 1.4, minHeight: '42px', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis',
                                                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                                                }}>
                                                    {task.title}
                                                </h3>

                                                {/* Course & Section Subtitle Redesign */}
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginBottom: '16px', minHeight: '26px' }}>
                                                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '4px 8px', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '6px', color: '#64748b', fontSize: '11px', fontWeight: 500, maxWidth: '100%' }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                                                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                                                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                                                        </svg>
                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }} title={course.title}>
                                                            {course.title.split('-')[0].trim()}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '4px 8px', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '6px', color: '#64748b', fontSize: '11px', fontWeight: 500 }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                                                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                                            <circle cx="11" cy="7" r="4" />
                                                        </svg>
                                                        {studentSection}
                                                    </div>
                                                </div>

                                                <div style={{ flexGrow: 1 }} />

                                                {/* Points & Progress */}
                                                <div style={{ width: '100%', marginBottom: '16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Points</span>
                                                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#3b82f6' }}>{task.score ?? 0} / {(task as any).points || 100} pts</span>
                                                    </div>
                                                    <div style={{ height: '6px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.min((Number(task.score ?? 0) / ((task as any).points || 100)) * 100, 100)}%` }}
                                                            transition={{ duration: 0.8 }}
                                                            style={{ height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)' }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Icons Row */}
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                                                    {/* Due Date Icon */}
                                                    <PreviewIconWithTooltip
                                                        label="Due Date"
                                                        subtitle={(task as any).dueDate ? new Date((task as any).dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}
                                                        color={(task as any).dueDate ? '#3b82f6' : '#94a3b8'}
                                                        bgColor={(task as any).dueDate ? 'rgba(59, 130, 246, 0.1)' : 'rgba(148, 163, 184, 0.1)'}
                                                        borderColor={(task as any).dueDate ? 'rgba(59, 130, 246, 0.15)' : 'rgba(148, 163, 184, 0.15)'}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={(task as any).dueDate ? '#3b82f6' : '#94a3b8'} strokeWidth="2">
                                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                            <line x1="16" y1="2" x2="16" y2="6" />
                                                            <line x1="8" y1="2" x2="8" y2="6" />
                                                            <line x1="3" y1="10" x2="21" y2="10" />
                                                        </svg>
                                                    </PreviewIconWithTooltip>

                                                    {/* Attempts Icon with Tooltip */}
                                                    <PreviewIconWithTooltip
                                                        label="Attempts"
                                                        subtitle={`${(task as any).maxAttempts || 1} attempt${((task as any).maxAttempts || 1) > 1 ? 's' : ''} allowed`}
                                                        color="#003DA5"
                                                        bgColor="rgba(0, 61, 165, 0.1)"
                                                        borderColor="rgba(0, 61, 165, 0.15)"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#003DA5" strokeWidth="2">
                                                            <polyline points="1 4 1 10 7 10" />
                                                            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                                                        </svg>
                                                    </PreviewIconWithTooltip>

                                                    {/* Late Submission Icon with Tooltip */}
                                                    <PreviewIconWithTooltip
                                                        label="Late Submission"
                                                        subtitle={(task as any).allowLateSubmission ? 'Allowed' : 'Not allowed'}
                                                        color={(task as any).allowLateSubmission ? '#10b981' : '#ef4444'}
                                                        bgColor={(task as any).allowLateSubmission ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}
                                                        borderColor={(task as any).allowLateSubmission ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={(task as any).allowLateSubmission ? '#10b981' : '#ef4444'} strokeWidth="2">
                                                            {(task as any).allowLateSubmission ? (
                                                                <polyline points="20 6 9 17 4 12" />
                                                            ) : (
                                                                <>
                                                                    <line x1="18" y1="6" x2="6" y2="18" />
                                                                    <line x1="6" y1="6" x2="18" y2="18" />
                                                                </>
                                                            )}
                                                        </svg>
                                                    </PreviewIconWithTooltip>

                                                    {/* Attachments Icon with Tooltip */}
                                                    {((task as any).attachments?.length > 0) && (
                                                        <PreviewIconWithTooltip
                                                            label="Attachments"
                                                            subtitle={`${(task as any).attachments.length} file${(task as any).attachments.length > 1 ? 's' : ''}`}
                                                            color="#f59e0b"
                                                            bgColor="rgba(245, 158, 11, 0.1)"
                                                            borderColor="rgba(245, 158, 11, 0.15)"
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                                                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                                                            </svg>
                                                        </PreviewIconWithTooltip>
                                                    )}

                                                    {/* Rubric Icon with Tooltip */}
                                                    {((task as any).rubricCriteria?.length > 0) && (
                                                        <PreviewIconWithTooltip
                                                            label="Rubric"
                                                            subtitle={`${(task as any).rubricCriteria.length} criteria`}
                                                            color="#ec4899"
                                                            bgColor="rgba(236, 72, 153, 0.1)"
                                                            borderColor="rgba(236, 72, 153, 0.15)"
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2">
                                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                                <line x1="3" y1="9" x2="21" y2="9" />
                                                                <line x1="9" y1="21" x2="9" y2="9" />
                                                            </svg>
                                                        </PreviewIconWithTooltip>
                                                    )}
                                                </div>

                                                {/* Styled Due Date Badge */}
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                                    <div style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                        padding: '4px 10px', borderRadius: '12px',
                                                        background: isOverdue ? 'rgba(239, 68, 68, 0.1)' : 'rgba(241, 245, 249, 1)',
                                                        border: `1px solid ${isOverdue ? 'rgba(239, 68, 68, 0.2)' : 'rgba(226, 232, 240, 1)'}`,
                                                        color: isOverdue ? '#dc2626' : '#64748b',
                                                        fontSize: '11px', fontWeight: 600
                                                    }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <path d="M12 6v6l4 2" />
                                                        </svg>
                                                        {task.due}
                                                    </div>

                                                    {(task as any).dueDate && (
                                                        <div style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                            padding: '4px 10px', borderRadius: '12px',
                                                            background: 'rgba(241, 245, 249, 1)',
                                                            border: '1px solid rgba(226, 232, 240, 1)',
                                                            color: '#475569',
                                                            fontSize: '11px', fontWeight: 600
                                                        }}>
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                                <line x1="3" y1="10" x2="21" y2="10" />
                                                            </svg>
                                                            Date to submit: {new Date((task as any).dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Bottom Button Area */}
                                            <div style={{ padding: '0 20px 24px 20px', marginTop: 'auto' }}>
                                                {(task.score !== null && task.score !== undefined) ? (
                                                    <div style={{
                                                        width: '100%', padding: '12px', borderRadius: '12px',
                                                        background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.12)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                                    }}>
                                                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#3b82f6' }}>Score: {task.score} / {(task as any).points || 100} pts</span>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {(() => {
                                                            const maxAttempts = (task as any).maxAttempts || 1;
                                                            const submissionCount = (task as any).submissionCount || 0;
                                                            const attemptsExhausted = maxAttempts > 1 && submissionCount >= maxAttempts;
                                                            const allowLate = (task as any).allowLateSubmission || false;
                                                            const latePenalty = (task as any).latePenalty || 0;
                                                            const isOverdue = task.status === 'overdue' || (task.due && task.due.toLowerCase().includes('overdue'));

                                                            // Calculate days late for penalty display
                                                            let daysLate = 0;
                                                            if (isOverdue && (task as any).dueDate) {
                                                                const dueDate = new Date((task as any).dueDate);
                                                                const now = new Date();
                                                                daysLate = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                                                            }
                                                            const totalPenalty = Math.min(100, daysLate * latePenalty);

                                                            // Case 1: All attempts used up
                                                            if (attemptsExhausted) {
                                                                return (
                                                                    <div style={{
                                                                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        gap: '6px', padding: '8px 14px',
                                                                        background: 'rgba(239, 68, 68, 0.06)', color: '#ef4444',
                                                                        border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '10px',
                                                                        fontSize: '12px', fontWeight: 600,
                                                                    }}>
                                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                                        </svg>
                                                                        No attempts remaining ({submissionCount}/{maxAttempts} used)
                                                                    </div>
                                                                );
                                                            }

                                                            // Case 2: Overdue and late submissions NOT allowed
                                                            if (isOverdue && !allowLate) {
                                                                return (
                                                                    <div style={{
                                                                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        gap: '6px', padding: '8px 14px',
                                                                        background: 'rgba(239, 68, 68, 0.06)', color: '#ef4444',
                                                                        border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '10px',
                                                                        fontSize: '12px', fontWeight: 600,
                                                                    }}>
                                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                                        </svg>
                                                                        Submission closed — past due date
                                                                    </div>
                                                                );
                                                            }

                                                            // Case 3: Overdue but late submissions ARE allowed
                                                            if (isOverdue && allowLate) {
                                                                return (
                                                                    <>
                                                                        {/* Late penalty warning */}
                                                                        {latePenalty > 0 && (
                                                                            <div style={{
                                                                                width: '100%', display: 'flex', alignItems: 'center', gap: '6px',
                                                                                padding: '6px 12px',
                                                                                background: 'rgba(245, 158, 11, 0.08)',
                                                                                border: '1px solid rgba(245, 158, 11, 0.15)',
                                                                                borderRadius: '8px',
                                                                                fontSize: '11px', fontWeight: 500, color: '#92400e',
                                                                            }}>
                                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                                                                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                                                                    <line x1="12" y1="9" x2="12" y2="13" />
                                                                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                                                                </svg>
                                                                                {daysLate} day{daysLate !== 1 ? 's' : ''} late · -{totalPenalty}% penalty applied
                                                                            </div>
                                                                        )}
                                                                        {!systemConfig.submissions_enabled ? (
                                                                            <div style={{
                                                                                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                gap: '6px', padding: '8px 14px',
                                                                                background: 'rgba(100, 116, 139, 0.08)', color: '#64748b',
                                                                                border: '1px solid rgba(100, 116, 139, 0.2)', borderRadius: '10px',
                                                                                fontSize: '13px', fontWeight: 600, cursor: 'not-allowed'
                                                                            }}>
                                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                                                </svg>
                                                                                Submissions Locked
                                                                            </div>
                                                                        ) : (
                                                                            <motion.button
                                                                                initial={{ opacity: 0, x: 10 }}
                                                                                animate={{ opacity: 1, x: 0 }}
                                                                            transition={{
                                                                                default: { duration: 0.15, ease: 'easeOut' },
                                                                                opacity: { delay: 0.35, duration: 0.3 },
                                                                                x: { delay: 0.35, duration: 0.3 }
                                                                            }}
                                                                            whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(245, 158, 11, 0.25)' }}
                                                                            whileTap={{ scale: 0.98 }}
                                                                            onClick={(e) => { e.stopPropagation(); setSubmitModalTask(task); }}
                                                                            style={{
                                                                                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                gap: '6px', padding: '8px 14px',
                                                                                background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b',
                                                                                border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '10px',
                                                                                fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                                                                            }}
                                                                        >
                                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                                <circle cx="12" cy="12" r="10" />
                                                                                <polyline points="12 6 12 12 16 14" />
                                                                            </svg>
                                                                            Submit Late
                                                                            {maxAttempts > 1 && (
                                                                                <span style={{
                                                                                    fontSize: '10px', padding: '1px 6px', borderRadius: '6px',
                                                                                    background: 'rgba(245, 158, 11, 0.12)', marginLeft: '2px',
                                                                                }}>
                                                                                    {maxAttempts - submissionCount} left
                                                                                </span>
                                                                            )}
                                                                        </motion.button>
                                                                        )}
                                                                    </>
                                                                );
                                                            }

                                                            // Case 4: Normal — on time, can submit
                                                            if (!systemConfig.submissions_enabled) {
                                                                return (
                                                                    <div style={{
                                                                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        gap: '6px', padding: '8px 14px',
                                                                        background: 'rgba(100, 116, 139, 0.08)', color: '#64748b',
                                                                        border: '1px solid rgba(100, 116, 139, 0.2)', borderRadius: '10px',
                                                                        fontSize: '13px', fontWeight: 600, cursor: 'not-allowed'
                                                                    }}>
                                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                                        </svg>
                                                                        Submissions Locked
                                                                    </div>
                                                                );
                                                            }

                                                            return (
                                                                <motion.button
                                                                    initial={{ opacity: 0, x: 10 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    transition={{
                                                                        default: { duration: 0.15, ease: 'easeOut' },
                                                                        opacity: { delay: 0.35, duration: 0.3 },
                                                                        x: { delay: 0.35, duration: 0.3 }
                                                                    }}
                                                                    whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(59, 130, 246, 0.25)' }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                    onClick={(e) => { e.stopPropagation(); setSubmitModalTask(task); }}
                                                                    style={{
                                                                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        gap: '6px', padding: '8px 14px',
                                                                        background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6',
                                                                        border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '10px',
                                                                        fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                                        <circle cx="12" cy="12" r="3" />
                                                                    </svg>
                                                                    Submit Task
                                                                    {maxAttempts > 1 && (
                                                                        <span style={{
                                                                            fontSize: '10px', padding: '1px 6px', borderRadius: '6px',
                                                                            background: 'rgba(59, 130, 246, 0.12)', marginLeft: '2px',
                                                                        }}>
                                                                            {maxAttempts - submissionCount} left
                                                                        </span>
                                                                    )}
                                                                </motion.button>
                                                            );
                                                        })()}

                                                    </div>
                                                )}

                                                <motion.button
                                                    initial={{ opacity: 0, x: 10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{
                                                        default: { duration: 0.15, ease: 'easeOut' },
                                                        opacity: { delay: 0.35, duration: 0.3 },
                                                        x: { delay: 0.35, duration: 0.3 }
                                                    }}
                                                    whileHover={{
                                                        scale: 1.02,
                                                        boxShadow: '0 6px 20px rgba(236, 72, 153, 0.25)',
                                                        borderColor: 'rgba(236, 72, 153, 0.5)',
                                                    }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setInstructionsTask(task);
                                                    }}
                                                    style={{
                                                        width: '100%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '6px',
                                                        padding: '8px 14px',
                                                        background: document.documentElement.classList.contains('dark') ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.5), rgba(71, 85, 105, 0.6) 50%, rgba(236, 72, 153, 0.15))' : 'linear-gradient(135deg, #f8fafc, #f1f5f9 50%, #fdf2f8)',
                                                        color: document.documentElement.classList.contains('dark') ? '#e2e8f0' : '#475569',
                                                        border: `1px solid ${document.documentElement.classList.contains('dark') ? 'rgba(236, 72, 153, 0.25)' : 'rgba(236, 72, 153, 0.2)'}`,
                                                        borderRadius: '10px',
                                                        fontSize: '13px',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        marginTop: '12px',
                                                        flexShrink: 0,
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                        transition: 'border-color 0.2s ease',
                                                    }}
                                                >
                                                    <div style={{
                                                        position: 'absolute', inset: 0,
                                                        background: 'linear-gradient(135deg, transparent, rgba(236, 72, 153, 0.08), transparent)',
                                                        opacity: 0.8, pointerEvents: 'none',
                                                    }} />
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginRight: '2px' }}>
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                        <polyline points="14 2 14 8 20 8" />
                                                        <line x1="16" y1="13" x2="8" y2="13" />
                                                        <line x1="16" y1="17" x2="8" y2="17" />
                                                        <polyline points="10 9 9 9 8 9" />
                                                    </svg>
                                                    <span style={{ color: document.documentElement.classList.contains('dark') ? '#cbd5e1' : '#475569' }}>View Instructions</span>
                                                    <span style={{ margin: '0 2px', color: '#ec4899', fontWeight: 800 }}>&amp;</span>
                                                    <span style={{ color: document.documentElement.classList.contains('dark') ? '#f472b6' : '#db2777' }}>Rubrics</span>
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                );
};

export default CourseAssignmentsTab;
