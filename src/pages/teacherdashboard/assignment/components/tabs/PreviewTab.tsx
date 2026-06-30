import React from 'react';
import { motion } from 'motion/react';
import { PreviewIconWithTooltip } from '../index';
import { useAssignmentContext } from '../../AssignmentFormContext';

const PreviewTab: React.FC = () => {
    const { formData, courses } = useAssignmentContext();
    return (
        
                                                <motion.div
                                                    key="preview"
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 10 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    {/* Preview Card - ModuleCard Style Design */}
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        whileHover={{
                                                            y: -4,
                                                            boxShadow: '0 12px 32px var(--accent-bg)'
                                                        }}
                                                        transition={{ duration: 0.2 }}
                                                        style={{
                                                            borderRadius: '20px',
                                                            border: '1px solid var(--border-subtle)',
                                                            background: 'var(--bg-surface)',
                                                            overflow: 'hidden',
                                                            cursor: 'default',
                                                        }}
                                                    >
                                                        {/* Card Content - Centered Layout */}
                                                        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                                            {/* Large Icon at Top with Gradient */}
                                                            <motion.div
                                                                whileHover={{ scale: 1.05, rotate: 3 }}
                                                                transition={{ duration: 0.1 }}
                                                                style={{
                                                                    width: '56px',
                                                                    height: '56px',
                                                                    borderRadius: '14px',
                                                                    background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-primary) 100%)',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    marginBottom: '12px',
                                                                    boxShadow: formData.type === 'quiz' ? '0 8px 20px var(--accent-bg)' : formData.type === 'project' ? '0 8px 20px var(--accent-bg)' : formData.type === 'journal' ? '0 8px 20px var(--accent-bg)' : '0 8px 20px var(--accent-bg)',
                                                                }}
                                                            >
                                                                {formData.type === 'quiz' ? (
                                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                                                                        <circle cx="12" cy="12" r="10" />
                                                                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                                                        <line x1="12" y1="17" x2="12.01" y2="17" />
                                                                    </svg>
                                                                ) : formData.type === 'project' ? (
                                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                                                                        <circle cx="12" cy="12" r="10" />
                                                                        <circle cx="12" cy="12" r="6" />
                                                                        <circle cx="12" cy="12" r="2" />
                                                                    </svg>
                                                                ) : formData.type === 'journal' ? (
                                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                                                                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                                                        <line x1="9" y1="7" x2="17" y2="7" />
                                                                        <line x1="9" y1="11" x2="15" y2="11" />
                                                                    </svg>
                                                                ) : (
                                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                                        <polyline points="14 2 14 8 20 8" />
                                                                        <line x1="16" y1="13" x2="8" y2="13" />
                                                                        <line x1="16" y1="17" x2="8" y2="17" />
                                                                    </svg>
                                                                )}
                                                            </motion.div>

                                                            {/* Type Badge */}
                                                            <motion.span
                                                                whileHover={{ scale: 1.05 }}
                                                                style={{
                                                                    padding: '5px 12px',
                                                                    borderRadius: '8px',
                                                                    background: 'var(--accent-bg)',
                                                                    border: '1px solid var(--border-subtle)',
                                                                    color: 'var(--accent-primary)',
                                                                    fontSize: '10px',
                                                                    fontWeight: 600,
                                                                    textTransform: 'uppercase',
                                                                    letterSpacing: '0.5px',
                                                                    marginBottom: '12px',
                                                                }}
                                                            >
                                                                {formData.type}
                                                            </motion.span>

                                                            {/* Title - Centered */}
                                                            <h3 style={{
                                                                margin: '0 0 6px 0',
                                                                fontSize: '15px',
                                                                fontWeight: 600,
                                                                color: 'var(--text-primary)',
                                                                lineHeight: 1.4,
                                                                maxWidth: '100%',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: 'vertical',
                                                            }}>
                                                                {formData.title || 'Untitled Assignment'}
                                                            </h3>

                                                            {/* Course & Section Info */}
                                                            <p style={{
                                                                margin: '0 0 16px 0',
                                                                fontSize: '12px',
                                                                color: 'var(--text-secondary)',
                                                            }}>
                                                                {courses.find(c => c.id === formData.course)?.name || 'No course'} • {formData.section || formData.sections.join(', ') || 'No section'}
                                                            </p>

                                                            {/* Progress Section - Points & Due Date */}
                                                            <div style={{ width: '100%', marginBottom: '16px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Points</span>
                                                                    <span style={{
                                                                        fontSize: '13px',
                                                                        fontWeight: 700,
                                                                        color: 'var(--accent-primary)'
                                                                    }}>{formData.points} pts</span>
                                                                </div>
                                                                <div style={{
                                                                    height: '6px',
                                                                    background: 'var(--accent-bg)',
                                                                    borderRadius: '999px',
                                                                    overflow: 'hidden'
                                                                }}>
                                                                    <motion.div
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: '100%' }}
                                                                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                                                        style={{
                                                                            height: '100%',
                                                                            borderRadius: '999px',
                                                                            background: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-primary) 100%)',
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Content Type Icons Row - Centered */}
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                                                                {/* Due Date Icon with Tooltip */}
                                                                <PreviewIconWithTooltip
                                                                    label="Due Date"
                                                                    subtitle={formData.dueDate ? new Date(formData.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}
                                                                    color='var(--accent-primary)'
                                                                    bgColor='var(--accent-bg)'
                                                                    borderColor='var(--border-subtle)'
                                                                >
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke='var(--accent-primary)' strokeWidth="2">
                                                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                                        <line x1="16" y1="2" x2="16" y2="6" />
                                                                        <line x1="8" y1="2" x2="8" y2="6" />
                                                                        <line x1="3" y1="10" x2="21" y2="10" />
                                                                    </svg>
                                                                </PreviewIconWithTooltip>
                                                                {/* Attempts Icon with Tooltip */}
                                                                <PreviewIconWithTooltip
                                                                    label="Attempts"
                                                                    subtitle={`${formData.maxAttempts} attempt${formData.maxAttempts > 1 ? 's' : ''} allowed`}
                                                                    color='var(--accent-primary)'
                                                                    bgColor='var(--accent-bg)'
                                                                    borderColor='var(--border-subtle)'
                                                                >
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke='var(--accent-primary)' strokeWidth="2">
                                                                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                                                                    </svg>
                                                                </PreviewIconWithTooltip>
                                                                {/* Late Submission Icon with Tooltip */}
                                                                <PreviewIconWithTooltip
                                                                    label="Late Submission"
                                                                    subtitle={formData.allowLateSubmission ? 'Allowed' : 'Not allowed'}
                                                                    color='var(--accent-primary)'
                                                                    bgColor='var(--accent-bg)'
                                                                    borderColor='var(--border-subtle)'
                                                                >
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke='var(--accent-primary)' strokeWidth="2">
                                                                        {formData.allowLateSubmission ? (
                                                                            <polyline points="20 6 9 17 4 12" />
                                                                        ) : (
                                                                            <>
                                                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                                                <line x1="6" y1="6" x2="18" y2="18" />
                                                                            </>
                                                                        )}
                                                                    </svg>
                                                                </PreviewIconWithTooltip>
                                                                {/* Attachments Icon with Tooltip */}
                                                                {formData.attachments.length > 0 && (
                                                                    <PreviewIconWithTooltip
                                                                        label="Attachments"
                                                                        subtitle={`${formData.attachments.length} file${formData.attachments.length > 1 ? 's' : ''}`}
                                                                        color='var(--accent-primary)'
                                                                        bgColor='var(--accent-bg)'
                                                                        borderColor='var(--border-subtle)'
                                                                    >
                                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke='var(--accent-primary)' strokeWidth="2">
                                                                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                                                                        </svg>
                                                                    </PreviewIconWithTooltip>
                                                                )}
                                                                {/* Rubric Icon with Tooltip */}
                                                                {formData.rubricCriteria.length > 0 && (
                                                                    <PreviewIconWithTooltip
                                                                        label="Rubric"
                                                                        subtitle={`${formData.rubricCriteria.length} criteria`}
                                                                        color='var(--accent-primary)'
                                                                        bgColor='var(--accent-bg)'
                                                                        borderColor='var(--border-subtle)'
                                                                    >
                                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke='var(--accent-primary)' strokeWidth="2">
                                                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                                            <line x1="3" y1="9" x2="21" y2="9" />
                                                                            <line x1="9" y1="21" x2="9" y2="9" />
                                                                        </svg>
                                                                    </PreviewIconWithTooltip>
                                                                )}
                                                            </div>

                                                            {/* Due Date & Time Display */}
                                                            <div style={{
                                                                fontSize: '11px',
                                                                color: 'var(--text-secondary)',
                                                                marginBottom: '16px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '4px',
                                                            }}>
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <circle cx="12" cy="12" r="10" />
                                                                    <polyline points="12 6 12 12 16 14" />
                                                                </svg>
                                                                {formData.dueDate ? (
                                                                    <>
                                                                        Due {new Date(formData.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                        {formData.dueTime && (() => {
                                                                            const [h, m] = formData.dueTime.split(':').map(Number);
                                                                            const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                                                                            const ampm = h < 12 ? 'AM' : 'PM';
                                                                            return ` at ${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
                                                                        })()}
                                                                    </>
                                                                ) : 'No due date set'}
                                                            </div>

                                                            {/* Action Button - Full Width */}
                                                            <motion.button
                                                                whileHover={{
                                                                    scale: 1.02,
                                                                    boxShadow: '0 6px 20px var(--accent-bg)'
                                                                }}
                                                                whileTap={{ scale: 0.98 }}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    borderRadius: '12px',
                                                                    border: 'none',
                                                                    background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-primary) 100%)',
                                                                    color: '#fff',
                                                                    fontSize: '13px',
                                                                    fontWeight: 600,
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    gap: '8px',
                                                                }}
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                                    <circle cx="12" cy="12" r="3" />
                                                                </svg>
                                                                View Assignment
                                                            </motion.button>
                                                        </div>

                                                    </motion.div>
                                                </motion.div>
    );
};

export default PreviewTab;
