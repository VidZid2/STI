/**
 * CourseAssignmentsTab
 * The assignments/tasks tab content for CourseViewPage.
 * Refactored to use a master-detail split layout modeled after the Modules tab.
 */
import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getCurrentUser } from '../../../../../services/authService';
import { EmptyState } from '../components/SharedComponents';
import type { CourseTask, TaskCategory } from '../data/demoCourses';
import { TaskCard } from '../components/TaskCard';

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
    setSubmitModalTask: (task: CourseTask | null) => void;
    setInstructionsModalTask: (task: CourseTask | null) => void;
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
    setSubmitModalTask,
    setInstructionsModalTask
}) => {
    const [selectedTaskId, setSelectedTaskId] = React.useState<string | number | null>(null);
    const [tasksPage, setTasksPage] = React.useState(1);
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

    // Keep selectedTaskId in sync with filteredTasks
    React.useEffect(() => {
        if (filteredTasks.length > 0) {
            const exists = filteredTasks.some(t => t.id === selectedTaskId);
            if (!exists) {
                setSelectedTaskId(filteredTasks[0].id);
            }
        } else {
            setSelectedTaskId(null);
        }
    }, [filteredTasks, selectedTaskId]);

    // Reset pagination when filter or search changes
    React.useEffect(() => {
        setTasksPage(1);
    }, [taskFilter, searchQuery]);

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


            {/* 2. Filter Cards (Matching Academic Semester/Grading Period) */}
            <div className="flex flex-col lg:flex-row items-stretch gap-6 w-full max-w-7xl mx-auto">
                {/* Status Panel */}
                <div className="w-full lg:w-[320px] xl:w-[380px] shrink-0 relative p-4 rounded-[20px] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
                    <div className="relative z-10">
                        <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 px-1">Task Status</h4>
                        <div className="flex p-1 bg-slate-50 dark:bg-zinc-800/50 rounded-[12px] border border-slate-100 dark:border-zinc-800 w-full">
                            {TASK_CATEGORIES.filter(c => ['all', 'overdue'].includes(c.id)).map((cat) => {
                                const count = getTaskCategoryCount(cat.id);
                                const isActive = taskFilter === cat.id;

                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setTaskFilter(cat.id)}
                                        className={`relative flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-[10px] text-sm font-bold transition-colors duration-200 ${
                                            isActive 
                                                ? 'text-blue-700 dark:text-blue-400' 
                                                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300'
                                        }`}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeStatusTab"
                                                className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-[10px] shadow-sm border border-slate-200/50 dark:border-zinc-600/50 z-0"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        <span className="relative z-10 whitespace-nowrap">{cat.label}</span>
                                        {count > 0 && (
                                            <motion.span layout className={`relative flex items-center z-10 px-1.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap overflow-hidden ${
                                                isActive
                                                    ? 'bg-blue-50/80 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                                                    : 'bg-slate-200/50 text-slate-500 dark:bg-zinc-700/50 dark:text-zinc-400'
                                            }`}>
                                                <motion.span layout>{count}</motion.span>
                                                <motion.span
                                                    initial={false}
                                                    animate={{ 
                                                        width: isActive ? "auto" : 0, 
                                                        opacity: isActive ? 1 : 0,
                                                        marginLeft: isActive ? 4 : 0
                                                    }}
                                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                    className="overflow-hidden block"
                                                >
                                                    {cat.id === 'all' ? 'total' : cat.id === 'overdue' ? 'overdue' : 'to do'}
                                                </motion.span>
                                            </motion.span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Type Panel */}
                <div className="flex-1 min-w-0 relative p-4 rounded-[20px] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
                    <div className="relative z-10">
                        <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 px-1">Task Type</h4>
                        <div className="flex flex-wrap p-1 bg-slate-50 dark:bg-zinc-800/50 rounded-[12px] border border-slate-100 dark:border-zinc-800 w-full">
                            {TASK_CATEGORIES.filter(c => !['all', 'overdue'].includes(c.id)).map((cat) => {
                                const count = getTaskCategoryCount(cat.id);
                                const isActive = taskFilter === cat.id;

                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setTaskFilter(cat.id)}
                                        className={`relative flex-auto flex items-center justify-center gap-2 py-2 px-3 rounded-[10px] text-sm font-bold transition-colors duration-200 ${
                                            isActive 
                                                ? 'text-blue-700 dark:text-blue-400' 
                                                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300'
                                        }`}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeTypeTab"
                                                className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-[10px] shadow-sm border border-slate-200/50 dark:border-zinc-600/50 z-0"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        <span className="relative z-10 whitespace-nowrap">{cat.label}</span>
                                        {count > 0 && (
                                            <motion.span layout className={`relative flex items-center z-10 px-1.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap overflow-hidden ${
                                                isActive
                                                    ? 'bg-blue-50/80 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                                                    : 'bg-slate-200/50 text-slate-500 dark:bg-zinc-700/50 dark:text-zinc-400'
                                            }`}>
                                                <motion.span layout>{count}</motion.span>
                                                <motion.span
                                                    initial={false}
                                                    animate={{ 
                                                        width: isActive ? "auto" : 0, 
                                                        opacity: isActive ? 1 : 0,
                                                        marginLeft: isActive ? 4 : 0
                                                    }}
                                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                    className="overflow-hidden block"
                                                >
                                                    {cat.id === 'all' ? 'total' : cat.id === 'overdue' ? 'overdue' : 'to do'}
                                                </motion.span>
                                            </motion.span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Task List */}
            {/* Task List */}
            {(() => {
                const selectedTask = filteredTasks.length > 0 ? (filteredTasks.find(t => t.id === selectedTaskId) || filteredTasks[0]) : null;
                const itemsPerPage = 3;
                const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
                const currentPage = Math.min(tasksPage, totalPages || 1);
                const startIndex = (currentPage - 1) * itemsPerPage;
                const paginatedTasks = filteredTasks.slice(startIndex, startIndex + itemsPerPage);

                return (
                    <div className="flex flex-col lg:flex-row items-stretch gap-6 w-full max-w-7xl mx-auto mt-2">
                        {/* Sidebar Navigation */}
                        <div className="w-full lg:w-[320px] xl:w-[380px] shrink-0 flex flex-col justify-between p-4 rounded-[20px] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm relative min-h-[480px]">
                            <div className="flex flex-col gap-3 flex-1 py-1">
                                <AnimatePresence mode="wait">
                                    {filteredTasks.length === 0 ? (
                                        <motion.div 
                                            key="empty-sidebar"
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                            className="flex flex-col items-center justify-center h-full text-center py-10 px-4"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-center text-slate-400 dark:text-zinc-500 mb-3 border border-slate-100 dark:border-zinc-800 shadow-sm">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M9 11l3 3L22 4" />
                                                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                                </svg>
                                            </div>
                                            <h3 className="text-[13px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
                                                {taskFilter !== 'all' ? `No ${TASK_CATEGORIES.find(c => c.id === taskFilter)?.label.toLowerCase()} found` : "No tasks found"}
                                            </h3>
                                            <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-500 tracking-wide">
                                                Nothing yet, so be ready!
                                            </p>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="task-list"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                            className="flex flex-col gap-3"
                                        >
                                            {paginatedTasks.map((task, index) => {
                                        const globalIndex = startIndex + index;
                                        const isSelected = task.id === selectedTaskId;
                                        
                                        const pointsScored = task.score !== null ? Number(task.score) : 0;
                                        const maxPoints = task.points || 100;
                                        const scorePercent = Math.round((pointsScored / maxPoints) * 100);

                                        const isCompleted = task.status === 'submitted' || task.status === 'resubmitted' || task.status === 'graded';
                                        const isLocked = task.status === 'locked';
                                        const isOverdue = task.status === 'overdue' || (task.due && task.due.toLowerCase().includes('overdue'));
                                        const categoryConfig = TASK_CATEGORIES.find(c => c.id === task.category) || TASK_CATEGORIES[1];

                                        let statusIcon;
                                        if (isCompleted) {
                                            statusIcon = (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            );
                                        } else if (isLocked) {
                                            statusIcon = (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80 text-zinc-400">
                                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                </svg>
                                            );
                                        } else {
                                            if (task.category === 'quiz') {
                                                statusIcon = (
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-amber-500">
                                                        <circle cx="12" cy="12" r="10" />
                                                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                                        <line x1="12" y1="17" x2="12.01" y2="17" />
                                                    </svg>
                                                );
                                            } else if (task.category === 'performance') {
                                                statusIcon = (
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-purple-500">
                                                        <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
                                                    </svg>
                                                );
                                            } else if (task.category === 'journal') {
                                                statusIcon = (
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-cyan-500">
                                                        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                                    </svg>
                                                );
                                            } else if (task.category === 'practical') {
                                                statusIcon = (
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-rose-500">
                                                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                                                    </svg>
                                                );
                                            } else {
                                                statusIcon = (
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-blue-500">
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                                                    </svg>
                                                );
                                            }
                                        }

                                        return (
                                            <motion.button
                                                key={task.id}
                                                onClick={() => setSelectedTaskId(task.id)}
                                                whileHover={!isLocked ? { scale: 1.02, y: -2 } : {}}
                                                whileTap={!isLocked ? { scale: 0.98 } : {}}
                                                className={`relative overflow-hidden flex items-center justify-between p-4 rounded-2xl border transition-colors duration-200 min-w-[250px] lg:min-w-0 w-full ${
                                                    isSelected
                                                        ? 'bg-white border-blue-200/80 shadow-sm dark:bg-zinc-900 dark:border-blue-800/50 hover:shadow-md hover:border-blue-200/80 dark:hover:border-blue-800/50 group'
                                                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 group'
                                                } ${isLocked ? 'opacity-70 grayscale-[0.2]' : ''}`}
                                            >
                                                {/* SaaS Background Accents */}
                                                {isSelected && (
                                                    <>
                                                        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-300 group-hover:scale-150" aria-hidden="true" />
                                                        <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-24 h-24 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none transition-transform duration-300 group-hover:scale-150" aria-hidden="true" />
                                                    </>
                                                )}

                                                <div className="flex items-center gap-3.5 min-w-0 flex-1 relative z-10">
                                                    {/* Custom Icon Container */}
                                                    <motion.div
                                                        whileHover={!isLocked ? { scale: 1.05, rotate: -5 } : {}}
                                                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                                        className={`w-11 h-11 rounded-[12px] flex items-center justify-center border shrink-0 shadow-sm relative transition-colors duration-200 ${
                                                            isLocked
                                                                ? 'border-zinc-200/40 dark:border-zinc-800/40 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-400 dark:text-zinc-500'
                                                                : isSelected
                                                                    ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400'
                                                                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/20 group-hover:border-blue-200 dark:group-hover:border-blue-800/50 group-hover:text-blue-500 dark:group-hover:text-blue-400'
                                                        }`}
                                                    >
                                                        {statusIcon}
                                                    </motion.div>

                                                    {/* Title text & Material description */}
                                                    <div className="min-w-0 flex-1 text-left flex flex-col items-start justify-center">
                                                        <p className={`text-[14px] font-bold leading-snug tracking-tight transition-colors truncate pr-1 w-full ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400'}`} title={task.title}>
                                                            {task.title}
                                                        </p>
                                                        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-normal mt-0.5 mb-2 truncate w-full">
                                                            {task.due}
                                                        </p>
                                                        <motion.div
                                                            whileHover={!isLocked ? { scale: 1.03 } : {}}
                                                            whileTap={!isLocked ? { scale: 0.97 } : {}}
                                                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border shadow-sm transition-colors duration-150 ${
                                                                isSelected
                                                                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200/80 dark:border-blue-800/50 text-blue-600 dark:text-blue-400'
                                                                    : 'bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 text-zinc-500 dark:text-zinc-400 group-hover:border-blue-200/80 dark:group-hover:border-blue-800/50 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                                                            }`}
                                                        >
                                                            <span className="shrink-0 flex items-center justify-center w-3.5 h-3.5 transition-colors">
                                                                {categoryConfig.icon}
                                                            </span>
                                                            <span>{categoryConfig.label}</span>
                                                        </motion.div>
                                                    </div>
                                                </div>

                                                {/* Action / Percentage Badge */}
                                                {(() => {
                                                    const radius = 10;
                                                    const circumference = 2 * Math.PI * radius;
                                                    const progress = task.score !== null ? scorePercent : 0;
                                                    const strokeDashoffset = circumference - (progress / 100) * circumference;

                                                    return (
                                                        <div className="relative w-auto h-10 px-3 flex items-center justify-center shrink-0 ml-3 z-10 bg-zinc-50 dark:bg-zinc-800/50 rounded-[12px] border border-zinc-200/80 dark:border-zinc-700 shadow-sm transition-all duration-300 group-hover:border-blue-200 dark:group-hover:border-blue-700/50 group-hover:bg-blue-50/50 dark:group-hover:bg-blue-900/20">
                                                            {isCompleted ? (
                                                                <div className="flex items-center gap-1.5">
                                                                    {task.score !== null ? (
                                                                        <>
                                                                            <div className="relative w-4 h-4 flex items-center justify-center">
                                                                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 24 24">
                                                                                    <circle cx="12" cy="12" r={radius} fill="transparent" stroke="currentColor" strokeWidth="4" className="text-zinc-200 dark:text-zinc-700" />
                                                                                    <motion.circle
                                                                                        cx="12" cy="12" r={radius} fill="transparent" stroke="currentColor" strokeWidth="4" strokeLinecap="round"
                                                                                        strokeDasharray={circumference}
                                                                                        initial={{ strokeDashoffset: circumference }}
                                                                                        animate={{ strokeDashoffset }}
                                                                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                                                                        className="text-emerald-500 dark:text-emerald-400"
                                                                                    />
                                                                                </svg>
                                                                            </div>
                                                                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                                                                {scorePercent}%
                                                                            </span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <svg className="w-4 h-4 text-emerald-500 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                                                                                <polyline points="20 6 9 17 4 12" />
                                                                            </svg>
                                                                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">DONE</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            ) : isOverdue ? (
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className="relative w-4 h-4 flex items-center justify-center">
                                                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 24 24">
                                                                            <circle cx="12" cy="12" r={radius} fill="transparent" stroke="currentColor" strokeWidth="4" className="text-zinc-200 dark:text-zinc-700" />
                                                                        </svg>
                                                                    </div>
                                                                    <span className="text-[11px] font-bold text-red-600 dark:text-red-400">LATE</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className="relative w-4 h-4 flex items-center justify-center">
                                                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 24 24">
                                                                            <circle cx="12" cy="12" r={radius} fill="transparent" stroke="currentColor" strokeWidth="4" className="text-zinc-200 dark:text-zinc-700" />
                                                                        </svg>
                                                                    </div>
                                                                    <span className={`text-[11px] font-bold tracking-tight text-blue-700 dark:text-blue-400 transition-colors duration-200`}>
                                                                        {maxPoints} PTS
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </motion.button>
                                        );
                                    })}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Pagination Controls */}
                            {filteredTasks.length > 3 && (
                                <div className="w-full pt-2.5 mt-2.5 border-t border-zinc-100 dark:border-zinc-800/80">
                                    <div className="flex items-center justify-between w-full gap-2 bg-white dark:bg-zinc-900 p-1.5 rounded-[14px] border border-zinc-200/60 dark:border-zinc-700/50 shadow-sm transition-all duration-300 hover:shadow-md">
                                        <motion.button
                                            type="button"
                                            onClick={() => setTasksPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            whileHover={currentPage > 1 ? { scale: 1.05 } : {}}
                                            whileTap={currentPage > 1 ? { scale: 0.95 } : {}}
                                            className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-colors duration-150 shadow-sm cursor-pointer border ${
                                                currentPage === 1
                                                    ? 'bg-zinc-50/50 dark:bg-zinc-900/20 border-zinc-100 dark:border-zinc-800/40 text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
                                                    : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 text-zinc-500 hover:text-blue-600 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 hover:border-blue-300 dark:hover:border-blue-500'
                                            }`}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                        </motion.button>
                                        <span className="text-[13px] font-bold text-zinc-700 dark:text-zinc-300 text-center tracking-wide flex-1">
                                            Page {currentPage} <span className="text-zinc-400 dark:text-zinc-500 font-medium mx-0.5">/</span> {totalPages}
                                        </span>
                                        <motion.button
                                            type="button"
                                            onClick={() => setTasksPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            whileHover={currentPage < totalPages ? { scale: 1.05 } : {}}
                                            whileTap={currentPage < totalPages ? { scale: 0.95 } : {}}
                                            className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-colors duration-150 shadow-sm cursor-pointer border ${
                                                currentPage === totalPages
                                                    ? 'bg-zinc-50/50 dark:bg-zinc-900/20 border-zinc-100 dark:border-zinc-800/40 text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
                                                    : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 text-zinc-500 hover:text-blue-600 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 hover:border-blue-300 dark:hover:border-blue-500'
                                            }`}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                        </motion.button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Detail Panel */}
                        <div className="flex-1 min-w-0" ref={tasksScrollRef}>
                            <AnimatePresence mode="wait">
                                {filteredTasks.length === 0 ? (
                                    <motion.div
                                        key="empty-detail"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.25, ease: 'easeOut' }}
                                        className="h-full"
                                    >
                                        <EmptyState
                                            icon={
                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                                    <path d="M9 11l3 3L22 4" />
                                                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                                </svg>
                                            }
                                            title={taskFilter !== 'all' ? `No ${TASK_CATEGORIES.find(c => c.id === taskFilter)?.label.toLowerCase()} found` : "No tasks found"}
                                            description="Nothing yet, so be ready!"
                                            className="h-full min-h-[480px]"
                                            action={(searchQuery || taskFilter !== 'all') ? {
                                                label: searchQuery ? 'Clear search' : 'Show all',
                                                onClick: () => { setSearchQuery(''); setTaskFilter('all'); }
                                            } : undefined}
                                        />
                                    </motion.div>
                                ) : selectedTask && (
                                    <motion.div
                                        key={selectedTask.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.25, ease: 'easeOut' }}
                                        className="h-full"
                                    >
                                        <TaskCard
                                            task={selectedTask}
                                            index={filteredTasks.findIndex(t => t.id === selectedTask.id)}
                                            course={course}
                                            systemConfig={systemConfig}
                                            setSubmitModalTask={setSubmitModalTask}
                                            setInstructionsModalTask={setInstructionsModalTask}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                );
            })()}
        </motion.div>
    );
};

export default CourseAssignmentsTab;
