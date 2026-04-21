/**
 * ActionsDropdown
 * Tab-contextual actions dropdown for CourseViewPage.
 * Extracted from CourseViewPage.tsx during Phase 8.1
 */
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type TabType = 'modules' | 'assignments' | 'news' | 'students' | 'teachers';

const TAB_ACTIONS: Record<TabType, { id: string; label: string; icon: React.ReactNode }[]> = {
    modules: [
        { id: 'continue', label: 'Continue Learning', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg> },
        { id: 'download', label: 'Download Materials', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0l-4-4m4 4l4-4" /><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" /></svg> },
        { id: 'syllabus', label: 'View Syllabus', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6M9 16h6M13 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V8l-5-5z" /><path d="M13 3v5h5" /></svg> },
    ],
    assignments: [
        { id: 'submit', label: 'Submit Assignment', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5m0 0l-7 7m7-7l7 7" /></svg> },
        { id: 'grades', label: 'View All Grades', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 16l4-4 4 4 5-6" /></svg> },
        { id: 'calendar', label: 'View Calendar', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> },
    ],
    news: [
        { id: 'mark-read', label: 'Mark All as Read', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg> },
        { id: 'notifications', label: 'Notification Settings', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg> },
    ],
    students: [
        { id: 'message-all', label: 'Message Class', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg> },
        { id: 'export', label: 'Export List', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg> },
        { id: 'groups', label: 'Create Groups', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
    ],
    teachers: [
        { id: 'schedule', label: 'Schedule Meeting', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> },
        { id: 'email', label: 'Send Email', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 6l-10 7L2 6" /></svg> },
        { id: 'office-hours', label: 'View Office Hours', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> },
    ],
};

// ─── ActionMenuItem ───────────────────────────────────────────────────────────
interface ActionMenuItemProps {
    action: { id: string; label: string; icon: React.ReactNode };
    index: number;
    onClick: () => void;
}

const ActionMenuItem: React.FC<ActionMenuItemProps> = ({ action, index, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.button
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.02, duration: 0.1 }}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                width: '100%', padding: '6px 8px', borderRadius: '6px', border: 'none',
                background: isHovered ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                color: isHovered ? '#3b82f6' : '#64748b',
                fontSize: '11px', fontWeight: 500, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left',
                transition: 'background 0.1s ease, color 0.1s ease',
            }}
        >
            <div style={{
                width: '22px', height: '22px', borderRadius: '6px',
                background: isHovered ? 'rgba(59, 130, 246, 0.12)' : 'rgba(0,0,0,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.1s ease',
            }}>
                <div style={{ width: '12px', height: '12px', color: isHovered ? '#3b82f6' : '#94a3b8', transition: 'color 0.1s ease' }}>
                    {action.icon}
                </div>
            </div>
            <span style={{ whiteSpace: 'nowrap' }}>{action.label}</span>
            <motion.svg
                initial={false}
                animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -4 }}
                transition={{ duration: 0.1 }}
                width="10" height="10" viewBox="0 0 24 24" fill="none"
                stroke="#3b82f6" strokeWidth="2.5"
                style={{ marginLeft: 'auto', flexShrink: 0 }}
            >
                <path d="M5 12h14M12 5l7 7-7 7" />
            </motion.svg>
        </motion.button>
    );
};

// ─── ActionsDropdown ──────────────────────────────────────────────────────────
interface ActionsDropdownProps {
    activeTab: TabType;
}

export const ActionsDropdown: React.FC<ActionsDropdownProps> = ({ activeTab }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const actions = TAB_ACTIONS[activeTab];

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
        <div ref={dropdownRef} style={{ position: 'relative', flexShrink: 0 }}>
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-haspopup="true"
                aria-expanded={isOpen}
                style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    height: '40px', padding: '0 14px', borderRadius: '12px',
                    border: `1px solid ${isOpen ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)'}`,
                    background: isOpen ? 'rgba(59, 130, 246, 0.1)' : isHovered ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.05)',
                    color: '#3b82f6', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                    transition: 'background 0.1s ease, border-color 0.1s ease',
                }}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
                </svg>
                <span>Actions</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}>
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                        />
                        <motion.div
                            role="menu"
                            initial={{ opacity: 0, y: -6, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.96 }}
                            transition={{ duration: 0.12, ease: 'easeOut' }}
                            style={{
                                position: 'absolute', top: '100%', right: 0, marginTop: '4px',
                                padding: '4px', borderRadius: '10px', background: '#ffffff',
                                border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                                zIndex: 50, minWidth: '150px',
                            }}
                        >
                            {actions.map((action, index) => (
                                <ActionMenuItem
                                    key={action.id}
                                    action={action}
                                    index={index}
                                    onClick={() => setIsOpen(false)}
                                />
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ActionsDropdown;
