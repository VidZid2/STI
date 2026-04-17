/**
 * SubmissionRulesSection — Extracted from SettingsTab (Phase 16 decomposition).
 * Groups: Allow Late Submissions, Maximum Attempts, Enable Rubric, Notify Students.
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SettingToggle } from './SchedulePublishSection';
import { useAssignmentContext } from '../../AssignmentFormContext';

const inputClass = "w-full px-3 py-2.5 rounded-lg text-[13px] font-medium outline-none box-border";
const inputStyle = { border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-primary)' };

const SectionCard: React.FC<{ children: React.ReactNode; purple?: boolean }> = ({ children, purple }) => (
    <div
        className="p-4 rounded-xl mb-5"
        style={purple
            ? { background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.2)' }
            : { background: 'var(--accent-bg)', border: '1px solid var(--border-subtle)' }
        }
    >
        {children}
    </div>
);

const SubmissionRulesSection: React.FC = () => {
    const { formData, updateFormData, setActiveTab } = useAssignmentContext();

    return (
        <>
            {/* Allow Late Submissions */}
            <SectionCard>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span className="text-[13px] font-semibold" style={{ color: 'var(--accent-primary)' }}>Allow Late Submissions</span>
                    </div>
                    <SettingToggle checked={formData.allowLateSubmission} onChange={(v) => updateFormData('allowLateSubmission', v)} label="Toggle allow late submissions" />
                </div>
                <p className="text-xs m-0" style={{ color: 'var(--text-secondary)' }}>Students can submit after the due date with a penalty.</p>
                <AnimatePresence>
                    {formData.allowLateSubmission && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3">
                            <div className="p-3 rounded-[10px]" style={{ background: 'var(--accent-bg)', border: '1px solid var(--border-subtle)' }}>
                                <label htmlFor="late-penalty-input" className="flex items-center gap-1.5 text-xs font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                        <path d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 0 0 1.73-3l-7-12a2 2 0 0 0-3.46 0l-7 12A2 2 0 0 0 5.07 19z" />
                                    </svg>
                                    Late Penalty (%)
                                </label>
                                <input id="late-penalty-input" type="number" value={formData.latePenalty}
                                    onChange={(e) => updateFormData('latePenalty', parseInt(e.target.value) || 0)}
                                    aria-label="Late penalty percentage per day"
                                    className={inputClass} style={inputStyle} />
                                <span className="block text-[11px] mt-1" style={{ color: 'var(--text-secondary)' }}>Percentage deducted per day late</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </SectionCard>

            {/* Maximum Attempts */}
            <SectionCard>
                <div className="flex items-center gap-2.5 mb-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" aria-hidden="true">
                        <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                    </svg>
                    <span className="text-[13px] font-semibold" style={{ color: 'var(--accent-primary)' }}>Maximum Attempts</span>
                </div>
                <p className="text-xs m-0 mb-3" style={{ color: 'var(--text-secondary)' }}>Number of times a student can submit (1 = single submission).</p>
                <input type="number" value={formData.maxAttempts} onChange={(e) => updateFormData('maxAttempts', parseInt(e.target.value) || 1)}
                    min={1} aria-label="Maximum submission attempts" className={inputClass} style={inputStyle} />
            </SectionCard>

            {/* Enable Rubric */}
            <SectionCard>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" aria-hidden="true">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
                        </svg>
                        <span className="text-[13px] font-semibold" style={{ color: 'var(--accent-primary)' }}>Enable Rubric</span>
                    </div>
                    <SettingToggle checked={formData.rubricEnabled} onChange={(v) => { updateFormData('rubricEnabled', v); if (v) setActiveTab('rubric' as never); }} label="Toggle rubric grading" />
                </div>
                <p className="text-xs m-0" style={{ color: 'var(--text-secondary)' }}>Use a grading rubric for this assignment.</p>
            </SectionCard>

            {/* Notify Students */}
            <SectionCard purple>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" aria-hidden="true">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        <span className="text-[13px] font-semibold" style={{ color: 'var(--accent-primary)' }}>Notify Students</span>
                    </div>
                    <SettingToggle checked={formData.notifyStudents} onChange={(v) => updateFormData('notifyStudents', v)} label="Toggle student notifications" />
                </div>
                <p className="text-xs m-0" style={{ color: 'var(--text-secondary)' }}>Send email notification when assignment is published.</p>
            </SectionCard>
        </>
    );
};

export default SubmissionRulesSection;
