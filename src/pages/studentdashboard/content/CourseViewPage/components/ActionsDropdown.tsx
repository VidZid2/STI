/**
 * ActionsDropdown
 * Tab-contextual actions dropdown for CourseViewPage.
 * Extracted from CourseViewPage.tsx during Phase 8.1
 */
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type TabType = 'modules' | 'assignments' | 'news' | 'students' | 'teachers';

const TAB_ACTIONS: Record<TabType, { id: string; label: string; description: string; icon: React.ReactNode }[]> = {
    modules: [
        { id: 'continue', label: 'Continue Learning', description: 'Pick up right where you left off in the module.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg> },
        { id: 'download', label: 'Download Materials', description: 'Save all course files and PDFs for offline use.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0l-4-4m4 4l4-4" /><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" /></svg> },
        { id: 'syllabus', label: 'View Syllabus', description: 'Read the course curriculum, grading metrics, and rules.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6M9 16h6M13 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V8l-5-5z" /><path d="M13 3v5h5" /></svg> },
    ],
    assignments: [
        { id: 'submit', label: 'Submit Assignment', description: 'Turn in your completed work for grading.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5m0 0l-7 7m7-7l7 7" /></svg> },
        { id: 'grades', label: 'View All Grades', description: 'Check your overall academic performance.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 16l4-4 4 4 5-6" /></svg> },
        { id: 'calendar', label: 'View Calendar', description: 'See upcoming deadlines and schedule events.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> },
    ],
    news: [
        { id: 'mark-read', label: 'Mark All as Read', description: 'Clear all your unread announcements.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg> },
        { id: 'notifications', label: 'Notification Settings', description: 'Manage how and when you receive alerts.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg> },
    ],
    students: [
        { id: 'message-all', label: 'Message Class', description: 'Send a group message to all your peers.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg> },
        { id: 'export', label: 'Export List', description: 'Download the student roster for offline use.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg> },
        { id: 'groups', label: 'Create Groups', description: 'Organize students into collaborative teams.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
    ],
    teachers: [
        { id: 'schedule', label: 'Schedule Meeting', description: 'Set up a virtual or in-person meeting.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> },
        { id: 'email', label: 'Send Email', description: 'Email the instructor or staff directly.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 6l-10 7L2 6" /></svg> },
        { id: 'office-hours', label: 'View Office Hours', description: 'Check instructor availability for consultation.', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> },
    ]
};

// ─── ActionMenuItem ───────────────────────────────────────────────────────────
interface ActionMenuItemProps {
    action: { id: string; label: string; description: string; icon: React.ReactNode };
    index: number;
    onClick: () => void;
}

const ActionMenuItem: React.FC<ActionMenuItemProps> = ({ action, index, onClick }) => {
    return (
        <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.2, type: 'spring', stiffness: 300, damping: 24 }}
            onClick={onClick}
            whileTap={{ scale: 0.97 }}
            className="w-full text-left p-2.5 sm:p-3 rounded-[14px] flex items-center gap-3 sm:gap-4 transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 group border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700/50"
        >
            <motion.div
                whileHover={{ scale: 1.05, rotate: -5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-[12px] bg-blue-50 border border-blue-100 dark:bg-blue-900/30 dark:border-blue-800/50 flex items-center justify-center flex-shrink-0 shadow-sm text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors duration-300"
            >
                <div className="w-4 h-4 sm:w-[18px] sm:h-[18px]">
                    {action.icon}
                </div>
            </motion.div>
            <div className="flex-1 min-w-0">
                <h3 className="text-[12px] sm:text-[13px] font-bold text-slate-900 dark:text-slate-100 truncate">{action.label}</h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{action.description}</p>
            </div>
            <div className="w-6 h-6 rounded-full bg-transparent group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 flex items-center justify-center flex-shrink-0 transition-colors duration-300">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-transparent group-hover:text-blue-500 transition-colors duration-300">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
        </motion.button>
    );
};

// ─── ActionsDropdown ──────────────────────────────────────────────────────────
interface ActionsDropdownProps {
    activeTab: TabType;
}

export const ActionsDropdown: React.FC<ActionsDropdownProps> = ({ activeTab }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const actions = TAB_ACTIONS[activeTab] || [];

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    useEffect(() => { setIsOpen(false); }, [activeTab]);

    if (actions.length === 0) return null;

    return (
        <div ref={dropdownRef} className="relative flex-1 sm:flex-initial z-50">
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                aria-haspopup="true"
                aria-expanded={isOpen}
                className={`flex items-center justify-center gap-2 h-10 w-full px-4 rounded-[14px] font-bold text-[13px] transition-all duration-200 border shadow-sm ${
                    isOpen 
                        ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800/50 dark:text-blue-400' 
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-slate-600'
                }`}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
                </svg>
                <span>Actions</span>
                <motion.svg 
                    width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
                >
                    <polyline points="6 9 12 15 18 9" />
                </motion.svg>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-40"
                        />
                        <motion.div
                            role="menu"
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
                            className="absolute top-full right-0 mt-2 p-2.5 sm:p-3 rounded-[18px] sm:rounded-[20px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl z-50 w-[280px] sm:w-[320px] overflow-hidden flex flex-col gap-0.5"
                        >
                            {/* Ambient Glow */}
                            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                            <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-20 h-20 bg-blue-400/5 rounded-full blur-2xl pointer-events-none" />

                            <div className="relative z-10 flex flex-col gap-0.5">
                                {actions.map((action, index) => (
                                    <ActionMenuItem
                                        key={action.id}
                                        action={action}
                                        index={index}
                                        onClick={() => setIsOpen(false)}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ActionsDropdown;
