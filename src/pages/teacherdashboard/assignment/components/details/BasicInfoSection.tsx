/**
 * BasicInfoSection — title, course/section dropdowns, assignment type grid,
 * due date/time/points, description, and instructions RichTextEditor.
 * Extracted from DetailsTab (Phase 20 decomposition).
 * Uses useAssignmentContext() — zero prop drilling.
 */
import React from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { generateAIInstructions } from '../../../../../lib/assignment/aiAssignmentService';
import {
    FormInput, FormTextarea, FormSelect,
    CustomDatePicker, CustomTimePicker, RichTextEditor,
} from '../index';
import { ASSIGNMENT_TYPES, getAssignmentTypeIcon } from '../../constants';
import { useAssignmentContext } from '../../AssignmentFormContext';
import { useSystemConfig } from '../../../../../contexts/SystemConfigContext';
import type { AssignmentFormData } from '../../types';

const BasicInfoSection: React.FC = () => {
    const { systemConfig } = useSystemConfig();
    const {
        formData, updateFormData,
        isMobile,
        courses, loadingCourses,
        availableSections,
        aiInstructionsLoading, setAiInstructionsLoading,
    } = useAssignmentContext();

    return (
        <>
            <FormInput
                label="Assignment Title"
                value={formData.title}
                onChange={(v) => updateFormData('title', v)}
                placeholder="e.g., Week 5 Programming Exercise"
                required
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>}
            />

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '12px' : '16px' }}>
                <FormSelect
                    label="Course"
                    value={formData.course}
                    onChange={(v) => { updateFormData('course', v); updateFormData('section', ''); updateFormData('sections', []); }}
                    options={courses.map(c => ({ value: c.id, label: c.name }))}
                    placeholder={loadingCourses ? "Loading courses..." : "Select course"}
                    required
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>}
                />
                <FormSelect
                    label="Section"
                    value={formData.section}
                    onChange={(v) => updateFormData('section', v)}
                    options={availableSections.map(s => ({ value: s, label: s }))}
                    placeholder={formData.course ? 'Select section' : 'Select course first'}
                    required
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>}
                />
            </div>

            {/* Assignment Type Selection */}
            <div style={{ marginBottom: isMobile ? '12px' : '16px' }}>
                <label style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: isMobile ? '12px' : '13px', fontWeight: 600,
                    color: 'var(--text-secondary)', marginBottom: isMobile ? '8px' : '10px',
                }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke='var(--accent-primary)' strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                    </svg>
                    Assignment Type
                    <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? '8px' : '10px' }}>
                    {ASSIGNMENT_TYPES.map((type) => {
                        const isSelected = formData.type === type.id;
                        const isPinkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('pink-theme');
                        const activeColor = isPinkMode ? '#ec4899' : type.color;
                        return (
                            <motion.button
                                key={type.id}
                                className={`assignment-type-btn ${isSelected ? 'selected' : ''}`}
                                onClick={() => updateFormData('type', type.id as AssignmentFormData['type'])}
                                whileHover={!isMobile ? { scale: 1.02, boxShadow: `0 6px 20px ${activeColor}20` } : undefined}
                                whileTap={{ scale: 0.98 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                style={{
                                    padding: isMobile ? '12px 10px' : '16px 12px',
                                    borderRadius: '12px',
                                    border: isSelected ? `1.5px solid ${activeColor}` : '1px solid var(--border-subtle)',
                                    background: isSelected ? `${activeColor}08` : 'var(--bg-surface)',
                                    cursor: 'pointer',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    gap: isMobile ? '6px' : '10px',
                                    transition: 'border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease',
                                    boxShadow: isSelected ? `0 4px 12px ${activeColor}15` : 'none',
                                }}
                            >
                                {getAssignmentTypeIcon(type.icon, activeColor, isSelected)}
                                <span style={{
                                    fontSize: isMobile ? '11px' : '12px', fontWeight: 600,
                                    color: isSelected ? activeColor : 'var(--text-secondary)',
                                    transition: 'color 0.2s ease',
                                }}>
                                    {type.label}
                                </span>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr', gap: isMobile ? '10px' : '16px' }}>
                <CustomDatePicker
                    label="Due Date"
                    value={formData.dueDate}
                    onChange={(v) => updateFormData('dueDate', v)}
                    required
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
                />
                <CustomTimePicker
                    label="Due Time"
                    value={formData.dueTime}
                    onChange={(v) => updateFormData('dueTime', v)}
                    required
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
                />
                <FormInput
                    label="Total Points"
                    value={formData.points}
                    onChange={(v) => updateFormData('points', parseInt(v) || 0)}
                    type="number"
                    required
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>}
                />
            </div>

            <FormTextarea
                label="Description"
                value={formData.description}
                onChange={(v) => updateFormData('description', v)}
                placeholder="Brief description of the assignment..."
                rows={3}
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="17" y1="18" x2="3" y2="18" /></svg>}
            />

            <RichTextEditor
                label="Instructions"
                value={formData.instructions}
                onChange={(v) => updateFormData('instructions', v)}
                placeholder="Detailed instructions for students... (supports formatting)"
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>}
                onAISuggest={systemConfig.ai_enabled ? async () => {
                    if (!formData.title.trim()) {
                        toast.warning('Please enter an assignment title first to generate instructions.');
                        return;
                    }
                    if (aiInstructionsLoading) return;
                    setAiInstructionsLoading(true);
                    try {
                        const result = await generateAIInstructions(
                            formData.title,
                            formData.description,
                            formData.type || 'assignment'
                        );
                        if (result.success) {
                            updateFormData('instructions', result.instructions);
                        } else {
                            toast.error('AI failed to generate instructions. Please try again.');
                        }
                    } catch {
                        toast.error('AI instructions generation failed.');
                    } finally {
                        setAiInstructionsLoading(false);
                    }
                } : undefined}
                aiSuggestLoading={aiInstructionsLoading}
            />
        </>
    );
};

export default BasicInfoSection;
