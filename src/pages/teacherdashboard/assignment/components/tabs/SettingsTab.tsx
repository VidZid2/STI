/**
 * SettingsTab — Assignment settings orchestrator.
 * Phase 16 decomposition: 779 lines → ~60 lines.
 * Migrated: inline styles → Tailwind + CSS variables
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FormSelect } from '../index';
import { useAssignmentContext } from '../../AssignmentFormContext';
import BatchCreateSection from '../settings/BatchCreateSection';
import SchedulePublishSection from '../settings/SchedulePublishSection';
import { SettingToggle } from '../settings/SchedulePublishSection';
import SubmissionRulesSection from '../settings/SubmissionRulesSection';

const SettingsTab: React.FC = () => {
    const { formData, updateFormData, otherCourses, availablePrerequisites } = useAssignmentContext();

    return (
        <motion.div key="settings" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
            <BatchCreateSection />
            <SchedulePublishSection />

            {/* Copy to Other Courses */}
            <div className="p-4 rounded-xl mb-5" style={{ background: 'var(--accent-bg)', border: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-2.5 mb-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" aria-hidden="true">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span className="text-[13px] font-semibold" style={{ color: 'var(--accent-primary)' }}>Copy to Other Courses</span>
                </div>
                <p className="text-xs m-0 mb-3" style={{ color: 'var(--text-secondary)' }}>Also create this assignment in other courses you teach.</p>
                {formData.course ? (
                    otherCourses.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            {otherCourses.map((course) => {
                                const isSelected = formData.copyToOtherCourses.includes(course.id);
                                return (
                                    <motion.button key={course.id}
                                        whileHover={{ background: isSelected ? 'rgba(16,185,129,0.15)' : 'rgba(0,0,0,0.04)' }}
                                        aria-pressed={isSelected}
                                        aria-label={`${isSelected ? 'Remove' : 'Add'} ${course.name}`}
                                        onClick={() => updateFormData('copyToOtherCourses', isSelected
                                            ? formData.copyToOtherCourses.filter(c => c !== course.id)
                                            : [...formData.copyToOtherCourses, course.id]
                                        )}
                                        className="flex items-center justify-between text-left cursor-pointer px-3.5 py-3 rounded-[10px]"
                                        style={{
                                            border: `1.5px solid ${isSelected ? 'var(--color-success)' : 'var(--border-subtle)'}`,
                                            background: isSelected ? 'rgba(16,185,129,0.1)' : 'var(--bg-surface)',
                                        }}
                                    >
                                        <div>
                                            <div className="text-[13px] font-medium" style={{ color: isSelected ? 'var(--color-success)' : 'var(--text-primary)' }}>{course.name}</div>
                                            <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{course.sections.length} sections available</div>
                                        </div>
                                        <div className="w-[22px] h-[22px] rounded-md flex items-center justify-center"
                                            style={{
                                                border: `2px solid ${isSelected ? 'var(--color-success)' : 'var(--border-subtle)'}`,
                                                background: isSelected ? 'var(--accent-primary)' : 'transparent',
                                            }}>
                                            {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>}
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    ) : <div className="text-xs italic" style={{ color: 'var(--text-muted)' }}>No other courses available</div>
                ) : <div className="text-xs italic" style={{ color: 'var(--text-muted)' }}>Select a course first to see other courses</div>}
            </div>

            {/* Prerequisite */}
            <div className="p-4 rounded-xl mb-5" style={{ background: 'var(--accent-bg)', border: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" aria-hidden="true">
                            <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                        <span className="text-[13px] font-semibold" style={{ color: 'var(--accent-primary)' }}>Prerequisite</span>
                    </div>
                    <SettingToggle checked={formData.prerequisiteEnabled} onChange={(v) => updateFormData('prerequisiteEnabled', v)} label="Toggle prerequisite requirement" />
                </div>
                <p className="text-xs m-0" style={{ color: 'var(--text-secondary)' }}>Students must complete another assignment before accessing this one.</p>
                <AnimatePresence>
                    {formData.prerequisiteEnabled && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3">
                            {formData.course ? (
                                availablePrerequisites.length > 0 ? (
                                    <div className="relative -mx-4 -mb-2">
                                        <FormSelect label="" value={formData.prerequisiteAssignment}
                                            onChange={(v) => updateFormData('prerequisiteAssignment', v)}
                                            options={availablePrerequisites.map((a) => ({ value: a.id, label: `[${a.type.toUpperCase()}] ${a.title}` }))}
                                            placeholder="Select prerequisite assignment..." />
                                        {formData.prerequisiteAssignment && (
                                            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                                                className="absolute right-3 top-3 w-[18px] h-[18px] rounded-full flex items-center justify-center pointer-events-none"
                                                style={{ background: 'var(--color-success)' }}>
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                                            </motion.div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-xs italic text-center px-3.5 py-3.5 rounded-[10px]"
                                        style={{ color: 'var(--text-muted)', background: 'var(--accent-bg)', border: '1px dashed var(--border-subtle)' }}>
                                        No existing assignments in this course to use as prerequisite
                                    </div>
                                )
                            ) : (
                                <div className="text-xs italic text-center px-3.5 py-3.5 rounded-[10px]"
                                    style={{ color: 'var(--text-muted)', background: 'var(--accent-bg)', border: '1px dashed var(--border-subtle)' }}>
                                    Select a course first to see available prerequisites
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Divider */}
            <div className="h-px my-6" style={{ background: 'var(--border-subtle)' }} />

            <SubmissionRulesSection />
        </motion.div>
    );
};

export default SettingsTab;
