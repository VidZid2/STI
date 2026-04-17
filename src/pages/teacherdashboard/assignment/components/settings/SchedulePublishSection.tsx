/**
 * SchedulePublishSection — Extracted from SettingsTab (Phase 16 decomposition).
 * Toggle + date/time picker for scheduling when an assignment goes live.
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CustomDatePicker, CustomTimePicker } from '../index';
import { useAssignmentContext } from '../../AssignmentFormContext';

export const SettingToggle: React.FC<{
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
}> = ({ checked, onChange, label }) => (
    <label aria-label={label} className="relative inline-block" style={{ fontSize: '10px', width: '3.5em', height: '2em' }}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="opacity-0 w-0 h-0" />
        <span className="absolute cursor-pointer inset-0 rounded-[30px] transition-[.4s]"
            style={{
                backgroundColor: checked ? 'var(--accent-primary)' : 'var(--bg-surface)',
                border: checked ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
            }}>
            <span className="absolute rounded-[20px] transition-[.4s]"
                style={{
                    height: '1.4em', width: '1.4em',
                    left: '0.27em', bottom: '0.25em',
                    backgroundColor: checked ? '#fff' : 'var(--text-secondary)',
                    transform: checked ? 'translateX(1.4em)' : 'translateX(0)',
                }} />
        </span>
    </label>
);

const SchedulePublishSection: React.FC = () => {
    const { formData, updateFormData } = useAssignmentContext();

    return (
        <div className="p-4 rounded-xl mb-5" style={{ background: 'var(--accent-bg)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="text-[13px] font-semibold" style={{ color: 'var(--accent-primary)' }}>Schedule Publish</span>
                </div>
                <SettingToggle checked={formData.schedulePublish} onChange={(v) => updateFormData('schedulePublish', v)} label="Toggle schedule publish" />
            </div>
            <p className="text-xs m-0" style={{ color: 'var(--text-secondary)' }}>
                Set a future date and time to automatically publish this assignment.
            </p>
            <AnimatePresence>
                {formData.schedulePublish && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="mt-4 p-4 rounded-[10px]"
                        style={{ background: 'var(--accent-bg)', border: '1px solid var(--border-subtle)' }}
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" aria-hidden="true">
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span className="text-[11px] font-medium" style={{ color: 'var(--accent-primary)' }}>
                                Assignment will be hidden until the scheduled date
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <CustomDatePicker label="Publish Date" value={formData.publishDate} onChange={(v) => updateFormData('publishDate', v)} required
                                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
                            />
                            <CustomTimePicker label="Publish Time" value={formData.publishTime} onChange={(v) => updateFormData('publishTime', v)} required
                                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
                            />
                        </div>
                        {formData.publishDate && (
                            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 mt-3 px-3 py-2.5 rounded-lg"
                                style={{ background: 'var(--accent-bg)' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" aria-hidden="true">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                                    Scheduled for {new Date(formData.publishDate + 'T' + formData.publishTime).toLocaleDateString('en-US', {
                                        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                                    })} at {(() => {
                                        const [h, m] = formData.publishTime.split(':').map(Number);
                                        const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                                        return `${hour12}:${m.toString().padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
                                    })()}
                                </span>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export { SettingToggle as default_SettingToggle };
export default SchedulePublishSection;
