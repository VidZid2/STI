import React from 'react';
import { motion } from 'motion/react';
import { UserAlertIcon, TrendDownIcon } from '../icons';
import type { ModalState } from '../types';

export interface AtRiskStudentData {
    id: string;
    name: string;
    section: string;
    subject: string;
    currentGrade: number;
    absences: number;
    issue: string;
    trend: 'declining' | 'stable' | 'improving';
}

interface AtRiskPanelProps {
    isLoadingAtRisk: boolean;
    atRiskStudents: AtRiskStudentData[];
    openModal: (modalName: keyof ModalState) => void;
}

export const AtRiskPanel: React.FC<AtRiskPanelProps> = ({
    isLoadingAtRisk,
    atRiskStudents,
    openModal
}) => {
    if (isLoadingAtRisk || atRiskStudents.length === 0) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="at-risk-panel mb-8 p-6 rounded-[20px] bg-gradient-to-br from-red-500/[0.04] to-surface/80 dark:to-slate-900/80 backdrop-blur-md border border-red-500/20 dark:border-red-500/30"
        >
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center text-red-500">
                        <UserAlertIcon size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white m-0">
                            Students Needing Attention
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 m-0">
                            {atRiskStudents.length} students may need intervention
                        </p>
                    </div>
                </div>
                <motion.button
                    className="dashboard-btn flex items-center gap-2 py-2 px-4 text-white text-sm font-medium rounded-lg border-none cursor-pointer shadow-[0_4px_12px_rgba(239,68,68,0.25)]"
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    whileHover={{ scale: 1.02, boxShadow: '0 8px 20px rgba(239, 68, 68, 0.3)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openModal('isAtRiskStudentsOpen')}
                    style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
                >
                    View All Students
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-3">
                {atRiskStudents.map((student, index) => (
                    <motion.div
                        key={student.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: 0.3 + index * 0.05 } }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        whileHover={{ scale: 1.01, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                        className="flex items-center gap-4 p-4 rounded-xl bg-surface/80 dark:bg-slate-900/60 border border-black/5 dark:border-white/10 cursor-pointer"
                    >
                        {/* Student Avatar */}
                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-blue-500 text-lg font-semibold shrink-0"
                             style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)' }}>
                            {student.name.split(' ').map(n => n[0]).join('')}
                        </div>

                        {/* Student Info */}
                        <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-semibold text-slate-900 dark:text-white truncate">
                                {student.name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <span>{student.section}</span>
                                <span className="text-slate-400 dark:text-slate-600">•</span>
                                <span>{student.subject}</span>
                            </div>
                        </div>

                        {/* Grade Alert Badge */}
                        <div className="flex flex-col items-end gap-1">
                            <div className="py-1 px-2 rounded-md bg-red-500/15 text-red-500 text-[13px] font-bold flex items-center gap-1">
                                <TrendDownIcon size={14} />
                                {student.currentGrade}%
                            </div>
                            <span className="text-[11px] text-red-500 font-medium">
                                {student.issue}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};
