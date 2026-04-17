/**
 * SaveAsTemplateSection — toggle + template name input.
 * Extracted from DetailsTab (Phase 20 decomposition).
 * Uses useAssignmentContext() — zero prop drilling.
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAssignmentContext } from '../../AssignmentFormContext';

const SaveAsTemplateSection: React.FC = () => {
    const { formData, updateFormData, isMobile } = useAssignmentContext();

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.2 }}
            whileHover={!isMobile ? { boxShadow: '0 4px 16px var(--accent-bg)', borderColor: 'var(--accent-primary)' } : undefined}
            className="rounded-xl cursor-pointer transition-all"
            style={{
                padding: isMobile ? '12px 14px' : '14px 16px',
                background: 'var(--accent-bg)',
                border: '1px solid var(--border-subtle)',
                marginTop: isMobile ? '8px' : '12px',
            }}
            onClick={() => updateFormData('saveAsTemplate', !formData.saveAsTemplate)}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center" style={{ gap: isMobile ? '10px' : '12px' }}>
                    <div className="flex items-center justify-center shrink-0"
                        style={{
                            width: isMobile ? '32px' : '36px',
                            height: isMobile ? '32px' : '36px',
                            borderRadius: isMobile ? '8px' : '10px',
                            background: 'var(--accent-bg)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--accent-primary)',
                        }}>
                        <svg width={isMobile ? "16" : "18"} height={isMobile ? "16" : "18"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                            <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
                        </svg>
                    </div>
                    <div>
                        <div className="font-semibold" style={{ fontSize: isMobile ? '12px' : '13px', color: 'var(--text-primary)' }}>Save as Template</div>
                        {!isMobile && <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>Reuse this assignment structure later</div>}
                    </div>
                </div>

                {/* Toggle */}
                <label className="relative inline-block shrink-0" style={{ fontSize: '10px', width: '3.5em', height: '2em' }}>
                    <input type="checkbox" aria-label="Save as template" checked={formData.saveAsTemplate}
                        onChange={(e) => { e.stopPropagation(); updateFormData('saveAsTemplate', e.target.checked); }}
                        onClick={(e) => e.stopPropagation()} className="opacity-0 w-0 h-0" />
                    <span className="absolute cursor-pointer inset-0 rounded-[30px] transition-[.4s]"
                        style={{
                            backgroundColor: formData.saveAsTemplate ? 'var(--accent-primary)' : 'var(--bg-surface)',
                            border: formData.saveAsTemplate ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                        }}>
                        <span className="absolute rounded-[20px] transition-[.4s]"
                            style={{
                                height: '1.4em', width: '1.4em', left: '0.27em', bottom: '0.25em',
                                backgroundColor: formData.saveAsTemplate ? '#fff' : 'var(--text-secondary)',
                                transform: formData.saveAsTemplate ? 'translateX(1.4em)' : 'translateX(0)',
                            }} />
                    </span>
                </label>
            </div>

            <AnimatePresence>
                {formData.saveAsTemplate && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }} className="mt-3.5 overflow-hidden">
                        <input type="text" value={formData.templateName}
                            onChange={(e) => updateFormData('templateName', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Template name (e.g., 'My Lab Exercise Template')"
                            aria-label="Template name"
                            className="w-full px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none transition-all"
                            style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                            onFocus={(e) => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.boxShadow = '0 0 0 3px var(--ring-focus)'; }}
                            onBlur={(e) => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.boxShadow = 'none'; }}
                        />
                        <div className="flex items-center gap-1.5 mt-2.5 px-2.5 py-2 rounded-lg" style={{ background: 'var(--accent-bg)' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                            <span className="text-[11px] font-medium" style={{ color: 'var(--accent-primary)' }}>
                                Your template will appear in "Use Previous Assignment" for future use
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default SaveAsTemplateSection;
