/**
 * BatchCreateSection — Extracted from SettingsTab (Phase 16 decomposition).
 * Allows creating the same assignment across multiple sections at once.
 */
import React from 'react';
import { motion } from 'motion/react';
import { useAssignmentContext } from '../../AssignmentFormContext';

const BatchCreateSection: React.FC = () => {
    const { formData, updateFormData, availableSections } = useAssignmentContext();

    return (
        <div style={{
            padding: '16px',
            borderRadius: '12px',
            background: 'var(--accent-bg)',
            border: '1px solid var(--ring-focus)',
            marginBottom: '20px',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" aria-hidden="true">
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                </svg>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-primary)' }}>Batch Create</span>
                <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'var(--accent-bg)', color: 'var(--accent-primary)', fontWeight: 600 }}>TIME SAVER</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                Create this assignment for multiple sections at once instead of one by one.
            </p>
            {formData.course ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {availableSections.map((section) => {
                        const isSelected = formData.sections.includes(section);
                        return (
                            <motion.button
                                key={section}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                aria-pressed={isSelected}
                                aria-label={`${isSelected ? 'Deselect' : 'Select'} section ${section}`}
                                onClick={() => {
                                    updateFormData('sections', isSelected
                                        ? formData.sections.filter(s => s !== section)
                                        : [...formData.sections, section]
                                    );
                                }}
                                style={{
                                    padding: '8px 14px', borderRadius: '8px',
                                    border: `1.5px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                                    background: isSelected ? 'var(--accent-bg)' : 'var(--bg-surface)',
                                    color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                    fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                }}
                            >
                                {isSelected && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                                {section}
                            </motion.button>
                        );
                    })}
                    <motion.button
                        whileHover={{ background: 'var(--accent-bg)' }}
                        aria-label={formData.sections.length === availableSections.length ? 'Deselect all sections' : 'Select all sections'}
                        onClick={() => {
                            updateFormData('sections',
                                formData.sections.length === availableSections.length ? [] : [...availableSections]
                            );
                        }}
                        style={{
                            padding: '8px 14px', borderRadius: '8px',
                            border: '1px dashed var(--ring-focus)', background: 'transparent',
                            color: 'var(--accent-primary)', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                        }}
                    >
                        {formData.sections.length === availableSections.length ? 'Deselect All' : 'Select All'}
                    </motion.button>
                </div>
            ) : (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Select a course first to see available sections
                </div>
            )}
        </div>
    );
};

export default BatchCreateSection;
