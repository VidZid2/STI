/**
 * MobileNavModal
 * Bottom sheet for mobile navigation: tabs + semester + term filters.
 * Only shown on screens below `sm` (640px).
 */
import * as React from 'react';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type TabType = 'modules' | 'assignments' | 'news' | 'students' | 'teachers';
type TeacherTabType = 'manage-tasks' | 'grade-students' | 'analytics';

const NAV_ITEMS: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
        id: 'modules', label: 'Modules',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
        ),
    },
    {
        id: 'assignments', label: 'Tasks',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
        ),
    },
    {
        id: 'news', label: 'News',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
        ),
    },
    {
        id: 'students', label: 'Students',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
    },
    {
        id: 'teachers', label: 'Teachers',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
        ),
    },
];

const TEACHER_NAV_ITEMS: { id: TeacherTabType; label: string; icon: React.ReactNode }[] = [
    {
        id: 'manage-tasks', label: 'Tasks',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" /><path d="M12 18v-6" /><path d="M9 15h6" />
            </svg>
        ),
    },
    {
        id: 'grade-students', label: 'Grades',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
        ),
    },
    {
        id: 'analytics', label: 'Analytics',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 3v18h18" /><path d="M7 16l4-4 4 4 5-6" />
            </svg>
        ),
    },
];

interface MobileNavModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    semesterFilter: 'first' | 'second';
    onSemesterChange: (val: 'first' | 'second') => void;
    termFilter: 'all' | 'prelims' | 'midterm' | 'prefinals' | 'finals';
    onTermChange: (val: 'all' | 'prelims' | 'midterm' | 'prefinals' | 'finals') => void;
    isTeacherMode: boolean;
    teacherTab: TeacherTabType;
    onTeacherTabChange: (tab: TeacherTabType) => void;
}

const MobileNavModal: React.FC<MobileNavModalProps> = ({
    isOpen,
    onClose,
    activeTab,
    onTabChange,
    semesterFilter,
    onSemesterChange,
    termFilter,
    onTermChange,
    isTeacherMode,
    teacherTab,
    onTeacherTabChange,
}) => {
    // Lock body scroll and hide bottom nav when open
    useEffect(() => {
        if (!isOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.documentElement.setAttribute('data-mobile-nav-open', 'true');
        return () => {
            document.body.style.overflow = prev;
            document.documentElement.removeAttribute('data-mobile-nav-open');
        };
    }, [isOpen]);

    const currentLabel = isTeacherMode
        ? TEACHER_NAV_ITEMS.find(t => t.id === teacherTab)?.label ?? 'Menu'
        : NAV_ITEMS.find(t => t.id === activeTab)?.label ?? 'Menu';

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/30 z-50 sm:hidden"
                        onClick={onClose}
                    />

                    {/* Bottom Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-white dark:bg-zinc-900 rounded-t-[24px] shadow-xl border-t border-zinc-200/80 dark:border-zinc-800/80 max-h-[85vh] flex flex-col"
                    >
                        {/* Drag Handle */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-5">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                                    {currentLabel}
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Navigation */}
                            <div>
                                <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 px-1">
                                    Navigate
                                </h3>
                                <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-[16px] border border-slate-100 dark:border-zinc-800 divide-y divide-slate-100 dark:divide-zinc-700/50 overflow-hidden">
                                    {(isTeacherMode ? TEACHER_NAV_ITEMS : NAV_ITEMS).map((item) => {
                                        const isActive = isTeacherMode
                                            ? teacherTab === item.id
                                            : activeTab === (item.id as TabType);
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => {
                                                    if (isTeacherMode) {
                                                        onTeacherTabChange(item.id as TeacherTabType);
                                                    } else {
                                                        onTabChange(item.id as TabType);
                                                    }
                                                    onClose();
                                                }}
                                                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                                                    isActive
                                                        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                                                }`}
                                            >
                                                <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 ${
                                                    isActive
                                                        ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                                                        : 'bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-slate-100 dark:border-zinc-700'
                                                }`}>
                                                    {item.icon}
                                                </div>
                                                <span className="text-sm font-bold flex-1 text-left">{item.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Removed Semester and Grading Period filters as requested, moved to main page */}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default MobileNavModal;
