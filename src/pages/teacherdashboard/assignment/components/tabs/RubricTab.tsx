import React from 'react';
import { motion } from 'motion/react';
import { RubricBuilder } from '../index';
import { BackgroundBeams } from '../../../../../components/ui/background-beams';
import { useAssignmentContext } from '../../AssignmentFormContext';

const RubricTab: React.FC = () => {
    const { formData, updateFormData } = useAssignmentContext();
    return (
        
                                                <motion.div
                                                    key="rubric"
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 10 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    {formData.rubricEnabled ? (
                                                        <>
                                                            <div style={{
                                                                padding: '16px',
                                                                borderRadius: '12px',
                                                                background: 'var(--accent-bg)',
                                                                border: '1px solid var(--border-subtle)',
                                                                marginBottom: '20px',
                                                            }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke='var(--accent-primary)' strokeWidth="2">
                                                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                                        <line x1="3" y1="9" x2="21" y2="9" />
                                                                        <line x1="9" y1="21" x2="9" y2="9" />
                                                                    </svg>
                                                                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-primary)' }}>Grading Rubric</span>
                                                                    <span style={{
                                                                        fontSize: '10px',
                                                                        fontWeight: 600,
                                                                        padding: '2px 8px',
                                                                        borderRadius: '6px',
                                                                        background: 'var(--accent-bg)',
                                                                        color: 'var(--accent-primary)',
                                                                        border: '1px solid var(--border-subtle)',
                                                                    }}>ACTIVE</span>
                                                                </div>
                                                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                                                                    Create a detailed rubric to ensure consistent and transparent grading. Students will see this rubric when viewing the assignment.
                                                                </p>
                                                            </div>

                                                            <RubricBuilder
                                                                criteria={formData.rubricCriteria}
                                                                onChange={(criteria) => updateFormData('rubricCriteria', criteria)}
                                                                totalPoints={formData.points}
                                                            />
                                                        </>
                                                    ) : (
                                                        <div style={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            padding: '80px 24px',
                                                            textAlign: 'center',
                                                            position: 'relative',
                                                            overflow: 'hidden',
                                                            borderRadius: '16px',
                                                            background: 'var(--bg-canvas)',
                                                        }}>
                                                            <BackgroundBeams />

                                                            {/* Icon Container with hover effect */}
                                                            <motion.div
                                                                whileHover={{ scale: 1.05, rotate: -2, translateY: -2 }}
                                                                style={{
                                                                    width: '80px',
                                                                    height: '80px',
                                                                    borderRadius: '24px',
                                                                    background: 'var(--bg-surface-alt)',
                                                                    border: '1px solid var(--border-subtle)',
                                                                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.07)',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    marginBottom: '24px',
                                                                    position: 'relative',
                                                                    zIndex: 10,
                                                                }}
                                                            >
                                                                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke='var(--text-secondary)' strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
                                                                    <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
                                                                    <line x1="3" y1="9" x2="21" y2="9" />
                                                                    <line x1="9" y1="21" x2="9" y2="9" />
                                                                </svg>
                                                            </motion.div>

                                                            <h4 style={{
                                                                fontSize: '18px',
                                                                fontWeight: 700,
                                                                color: 'var(--text-primary)',
                                                                margin: '0 0 12px 0',
                                                                letterSpacing: '-0.3px',
                                                                position: 'relative',
                                                                zIndex: 10,
                                                            }}>Rubric Not Enabled</h4>

                                                            <p style={{
                                                                fontSize: '14px',
                                                                color: 'var(--text-secondary)', lineHeight: 1.6,
                                                                maxWidth: '360px',
                                                                margin: '0 0 28px 0',
                                                                position: 'relative',
                                                                zIndex: 10,
                                                            }}>
                                                                Enable the rubric toggle in the Settings tab to create a grading rubric for this assignment.
                                                            </p>

                                                            <motion.button
                                                                whileHover={{ scale: 1.04, boxShadow: '0 8px 24px var(--accent-bg)' }}
                                                                whileTap={{ scale: 0.97 }}
                                                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                                                onClick={() => {
                                                                    updateFormData('rubricEnabled', true);
                                                                }}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '8px',
                                                                    padding: '12px 24px',
                                                                    background: 'var(--accent-bg)',
                                                                    color: 'var(--accent-primary)',
                                                                    border: '1px solid var(--border-subtle)',
                                                                    borderRadius: '12px',
                                                                    fontSize: '14px',
                                                                    fontWeight: 600,
                                                                    cursor: 'pointer',
                                                                    boxShadow: 'none',
                                                                    transition: 'all 0.15s ease',
                                                                    position: 'relative',
                                                                    zIndex: 10,
                                                                }}
                                                            >
                                                                Enable Rubric Now
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                                                </svg>
                                                            </motion.button>
                                                        </div>
                                                    )}
                                                </motion.div>
    );
};

export default RubricTab;
